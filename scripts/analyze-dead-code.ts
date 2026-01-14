#!/usr/bin/env tsx

/**
 * Dead Code Analysis Script
 *
 * This script analyzes the codebase to find potentially unused:
 * - API routes not referenced in frontend
 * - Prisma models with no queries
 * - Functions/exports not imported elsewhere
 * - Components not used
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const ROOT_DIR = path.resolve(__dirname, '..')

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title: string) {
  console.log('')
  log('═'.repeat(60), 'cyan')
  log(` ${title}`, 'cyan')
  log('═'.repeat(60), 'cyan')
  console.log('')
}

// Get all API routes
function getApiRoutes(): string[] {
  const apiDir = path.join(ROOT_DIR, 'app/api')
  const routes: string[] = []

  function walkDir(dir: string, basePath: string = '/api') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const newBasePath = entry.name.startsWith('[')
          ? `${basePath}/${entry.name}`
          : `${basePath}/${entry.name}`
        walkDir(fullPath, newBasePath)
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        routes.push(basePath)
      }
    }
  }

  if (fs.existsSync(apiDir)) {
    walkDir(apiDir)
  }

  return routes
}

// Get all Prisma models
function getPrismaModels(): string[] {
  const schemaPath = path.join(ROOT_DIR, 'prisma/schema.prisma')
  const models: string[] = []

  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    const modelRegex = /^model\s+(\w+)\s*\{/gm
    let match

    while ((match = modelRegex.exec(content)) !== null) {
      models.push(match[1])
    }
  }

  return models
}

// Get all exported functions from lib/
function getLibExports(): { file: string; exports: string[] }[] {
  const libDir = path.join(ROOT_DIR, 'lib')
  const results: { file: string; exports: string[] }[] = []

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walkDir(fullPath)
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const exports: string[] = []

        // Match export function
        const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g
        let match
        while ((match = funcRegex.exec(content)) !== null) {
          exports.push(match[1])
        }

        // Match export const
        const constRegex = /export\s+const\s+(\w+)/g
        while ((match = constRegex.exec(content)) !== null) {
          exports.push(match[1])
        }

        // Match named exports
        const namedRegex = /export\s+\{\s*([^}]+)\s*\}/g
        while ((match = namedRegex.exec(content)) !== null) {
          const names = match[1].split(',').map((n) => n.trim().split(' as ')[0].trim())
          exports.push(...names)
        }

        if (exports.length > 0) {
          const relativePath = path.relative(ROOT_DIR, fullPath)
          results.push({ file: relativePath, exports })
        }
      }
    }
  }

  walkDir(libDir)
  return results
}

// Search for usage of a string in the codebase
function searchUsage(searchTerm: string, excludePatterns: string[] = []): number {
  try {
    const excludeArgs = excludePatterns.map((p) => `--exclude="${p}"`).join(' ')
    const result = execSync(
      `grep -r "${searchTerm}" "${ROOT_DIR}/app" "${ROOT_DIR}/lib" "${ROOT_DIR}/components" ${excludeArgs} 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim(), 10)
  } catch {
    return 0
  }
}

// Main analysis
async function analyze() {
  log('Dead Code Analysis Report', 'magenta')
  log(`Analyzed at: ${new Date().toISOString()}`, 'yellow')

  const report = {
    potentiallyUnusedRoutes: [] as string[],
    potentiallyUnusedModels: [] as string[],
    potentiallyUnusedExports: [] as { file: string; export: string }[],
    summary: {
      totalApiRoutes: 0,
      totalModels: 0,
      totalExports: 0,
      potentiallyUnused: 0,
    },
  }

  // Analyze API Routes
  section('API Routes Analysis')
  const apiRoutes = getApiRoutes()
  report.summary.totalApiRoutes = apiRoutes.length
  log(`Found ${apiRoutes.length} API routes`, 'blue')

  for (const route of apiRoutes) {
    // Convert route to potential frontend usage patterns
    const routePattern = route.replace(/\[(\w+)\]/g, '') // Remove dynamic params
    const cleanRoute = routePattern.replace(/\/+$/, '') // Remove trailing slashes

    // Search for fetch calls to this route
    const usageCount = searchUsage(cleanRoute, ['*.test.ts', 'route.ts'])

    if (usageCount === 0) {
      report.potentiallyUnusedRoutes.push(route)
      log(`  ⚠️  ${route} - No frontend references found`, 'yellow')
    } else {
      log(`  ✓  ${route} - ${usageCount} references found`, 'green')
    }
  }

  // Analyze Prisma Models
  section('Prisma Models Analysis')
  const models = getPrismaModels()
  report.summary.totalModels = models.length
  log(`Found ${models.length} Prisma models`, 'blue')

  for (const model of models) {
    // Search for prisma.modelName usage
    const lowerModel = model.charAt(0).toLowerCase() + model.slice(1)
    const usageCount = searchUsage(`prisma.${lowerModel}`, ['schema.prisma'])

    if (usageCount === 0) {
      report.potentiallyUnusedModels.push(model)
      log(`  ⚠️  ${model} - No queries found`, 'yellow')
    } else {
      log(`  ✓  ${model} - ${usageCount} query references found`, 'green')
    }
  }

  // Analyze lib exports
  section('Library Exports Analysis')
  const libExports = getLibExports()
  const totalExports = libExports.reduce((sum, f) => sum + f.exports.length, 0)
  report.summary.totalExports = totalExports
  log(`Found ${totalExports} exports across ${libExports.length} lib files`, 'blue')

  for (const { file, exports } of libExports) {
    for (const exp of exports) {
      // Skip common exports that are used dynamically
      if (['prisma', 'auth', 'handlers'].includes(exp)) continue

      const usageCount = searchUsage(exp, [file, '*.test.ts'])

      if (usageCount <= 1) {
        // 1 or less means only the export itself
        report.potentiallyUnusedExports.push({ file, export: exp })
        log(`  ⚠️  ${file}: ${exp} - Possibly unused`, 'yellow')
      }
    }
  }

  // Summary
  section('Summary')
  report.summary.potentiallyUnused =
    report.potentiallyUnusedRoutes.length +
    report.potentiallyUnusedModels.length +
    report.potentiallyUnusedExports.length

  log(`Total API Routes: ${report.summary.totalApiRoutes}`, 'blue')
  log(`Total Prisma Models: ${report.summary.totalModels}`, 'blue')
  log(`Total Library Exports: ${report.summary.totalExports}`, 'blue')
  console.log('')
  log(`Potentially Unused API Routes: ${report.potentiallyUnusedRoutes.length}`, 'yellow')
  log(`Potentially Unused Prisma Models: ${report.potentiallyUnusedModels.length}`, 'yellow')
  log(`Potentially Unused Exports: ${report.potentiallyUnusedExports.length}`, 'yellow')
  console.log('')
  log(`Total Potentially Unused Items: ${report.summary.potentiallyUnused}`, 'magenta')

  // Detailed report
  if (report.potentiallyUnusedRoutes.length > 0) {
    section('Potentially Unused API Routes')
    log('These routes have no apparent frontend references:', 'yellow')
    for (const route of report.potentiallyUnusedRoutes) {
      log(`  - ${route}`, 'red')
    }
    log('\nNote: Some routes may be called dynamically or via external services.', 'cyan')
  }

  if (report.potentiallyUnusedModels.length > 0) {
    section('Potentially Unused Prisma Models')
    log('These models have no direct prisma queries:', 'yellow')
    for (const model of report.potentiallyUnusedModels) {
      log(`  - ${model}`, 'red')
    }
    log('\nNote: Some models may be accessed through relations or raw queries.', 'cyan')
  }

  if (report.potentiallyUnusedExports.length > 0) {
    section('Potentially Unused Library Exports')
    log('These exports have no apparent usage:', 'yellow')
    for (const { file, export: exp } of report.potentiallyUnusedExports) {
      log(`  - ${file}: ${exp}`, 'red')
    }
    log('\nNote: Some exports may be used dynamically or in tests.', 'cyan')
  }

  // Save report
  const reportPath = path.join(ROOT_DIR, 'dead-code-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`\nFull report saved to: ${reportPath}`, 'green')

  // Recommendations
  section('Recommendations')
  log('1. Review each potentially unused item manually before removal', 'cyan')
  log('2. Check if items are used in tests, migrations, or seed scripts', 'cyan')
  log('3. Look for dynamic imports or string-based references', 'cyan')
  log('4. Consider if items are used by external services or webhooks', 'cyan')
  log('5. Run the test suite after any removal to catch regressions', 'cyan')

  return report
}

// Run analysis
analyze().catch(console.error)

"use client"

import { useId } from "react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FooterLink {
  label: string
  url: string
  openInNewTab?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterAccordionProps {
  sections: FooterSection[]
}

export function FooterAccordion({ sections }: FooterAccordionProps) {
  const baseId = useId()

  return (
    <Accordion type="single" collapsible className="w-full">
      {sections.map((section, index) => (
        <AccordionItem key={`${baseId}-${index}`} value={`${baseId}-item-${index}`} className="border-white/10">
          <AccordionTrigger
            className="font-bold hover:no-underline"
            style={{
              color: "var(--footer-title-color)",
              fontFamily: "var(--global-font)",
              fontSize: "var(--footer-title-size)",
              fontWeight: "var(--footer-title-weight)" as unknown as number,
            }}
          >
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label} className="flex items-center gap-2">
                  <span className="text-xs shrink-0" style={{ color: "var(--footer-link-color)" }}>•</span>
                  <Link
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:opacity-80 transition-colors"
                    style={{
                      color: "var(--footer-link-color)",
                      fontFamily: "var(--global-font)",
                      fontSize: "var(--footer-link-size)",
                      fontWeight: 700,
                      lineHeight: "37px",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

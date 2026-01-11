"use client"

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
  return (
    <Accordion type="single" collapsible className="w-full">
      {sections.map((section, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
          <AccordionTrigger
            className="text-white font-bold hover:no-underline"
            style={{
              fontFamily: "Montserrat",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label} className="flex items-center gap-2">
                  <span className="text-white text-xs shrink-0">•</span>
                  <Link
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="text-white hover:text-gray-300 transition-colors"
                    style={{
                      fontFamily: "Montserrat",
                      fontSize: "14px",
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

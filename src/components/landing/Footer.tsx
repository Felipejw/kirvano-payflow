import { Code, Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Produto: [
    { label: "Funcionalidades", href: "#" },
    { label: "Preços", href: "#" },
    { label: "Integrações", href: "#" },
    { label: "API PIX", href: "#" },
  ],
  Empresa: [
    { label: "Sobre", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Contato", href: "#" },
  ],
  Recursos: [
    { label: "Documentação", href: "#" },
    { label: "Guias", href: "#" },
    { label: "Status", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos", href: "#" },
    { label: "Segurança", href: "#" },
    { label: "Compliance", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
              <span className="font-bold text-xl">PixPay</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Gateway de pagamentos completo para escalar seu negócio digital com PIX.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 PixPay. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Feito com</span>
            <Code className="h-4 w-4 text-primary" />
            <span>no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

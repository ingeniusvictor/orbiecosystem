import { Gamepad2, Briefcase, Code, Cpu, Github, Linkedin, Twitter, Globe } from "lucide-react";

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 font-sans border-t border-slate-900 pt-16 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-slate-900">
          
          {/* Column 1: Brand presentation */}
          <div className="md:col-span-4 space-y-4">
            <div 
              onClick={() => onNavigate("hero")}
              className="flex items-center space-x-3 cursor-pointer group w-fit"
            >
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-emerald-500 p-[1.5px]">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <span className="text-white font-black text-[10px] tracking-widest pl-[0.5px]">Ø</span>
                </div>
              </div>
              <span className="text-white font-bold tracking-wider text-base">
                ORBI <span className="text-slate-500 font-medium text-xs tracking-widest pl-0.5">ECOSYSTEM</span>
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              Un universo digital interconectado que combina el poder operacional de la Inteligencia Artificial corporativa, la sinergia de los videojuegos y la robustez de APIs de integración segura.
            </p>

            <p className="text-xs text-slate-500 font-semibold tracking-wide flex items-center space-x-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              <span>Designed as a modular intelligent ecosystem.</span>
            </p>
          </div>

          {/* Column 2: System Division links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase text-white font-mono tracking-widest font-bold">ORBI Systems</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate("divisiones")}
                  className="hover:text-blue-400 flex items-center space-x-1.5 transition-colors cursor-pointer text-slate-400"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Orbi Games System</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("divisiones")}
                  className="hover:text-emerald-400 flex items-center space-x-1.5 transition-colors cursor-pointer text-slate-400"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Orbi Corporate System</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("divisiones")}
                  className="hover:text-purple-400 flex items-center space-x-1.5 transition-colors cursor-pointer text-slate-400"
                >
                  <Code className="w-3.5 h-3.5 text-purple-400" />
                  <span>Orbi Development System</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Intelligent core links */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs uppercase text-white font-mono tracking-widest font-bold">Inteligencia Core</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate("foton-prime")}
                  className="hover:text-purple-300 flex items-center space-x-2 transition-colors cursor-pointer text-slate-400"
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Orbi Foton Prime</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("roadmap")}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-slate-400"
                >
                  <span>Hoja de Ruta</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("ecosistema")}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-slate-400"
                >
                  <span>Diferenciadores</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Links & Social */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase text-white font-mono tracking-widest font-bold font-sans">Redes y Canales</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Sigue el desarrollo técnico del ecosistema modular de ORBI.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a 
                href="#" 
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-850 hover:border-slate-755 rounded-xl transition-all"
                title="Sigue el código en GitHub"
              >
                <Github className="w-4.5 h-4.5" />
              </a>
              <a 
                href="#" 
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-blue-400 border border-slate-850 hover:border-slate-755 rounded-xl transition-all"
                title="LinkedIn Corporativo"
              >
                <Linkedin className="w-4.5 h-4.5" />
              </a>
              <a 
                href="#" 
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-sky-400 border border-slate-850 hover:border-slate-755 rounded-xl transition-all"
                title="Canal Twitter / X"
              >
                <Twitter className="w-4.5 h-4.5" />
              </a>
              <a 
                href="#" 
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 border border-slate-850 hover:border-slate-755 rounded-xl transition-all"
                title="Portal Público Web"
              >
                <Globe className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Closing details legal area */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} ORBI ECOSYSTEM. Todos los derechos reservados.</p>
          <div className="flex space-x-4 items-center">
            <a href="#" className="hover:text-slate-400 transition-colors">Términos de Servicio</a>
            <span className="text-slate-800">•</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Políticas de Privacidad</a>
            <span className="text-slate-800">•</span>
            <span className="text-slate-600 font-mono">HASH: FOTON_SEC_P_0x{currentYear}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

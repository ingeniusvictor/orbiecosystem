import { BENEFITS } from "../data";
import { Layers, Brain, CheckCircle, Sparkles, TrendingUp, Zap, LucideIcon } from "lucide-react";

export default function Differentiators() {
  const getIcon = (name: string) => {
    switch (name) {
      case "Layers":
        return <Layers className="w-5 h-5 text-blue-400" />;
      case "Brain":
        return <Brain className="w-5 h-5 text-purple-400" />;
      case "CheckCircle":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case "TrendingUp":
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-indigo-400" />;
      default:
        return <Zap className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (name: string) => {
    switch (name) {
      case "Layers": return "hover:border-blue-500/30";
      case "Brain": return "hover:border-purple-500/30";
      case "CheckCircle": return "hover:border-emerald-500/30";
      case "Sparkles": return "hover:border-pink-500/30";
      case "TrendingUp": return "hover:border-amber-500/30";
      case "Zap": return "hover:border-indigo-500/30";
      default: return "hover:border-slate-800";
    }
  };

  return (
    <section id="ecosistema" className="py-24 bg-slate-950 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-1 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 tracking-wider">
            <span>VALOR COMPORTAMENTAL // ORB-VAL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ¿Qué hace diferente a ORBI?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Nuestro ecosistema tecnológico rompe las barreras tradicionales del software uniendo soluciones de desarrollo industrial real con mundos lúdicos y automatización cognitiva.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {BENEFITS.map((benefit, index) => (
            <div
              key={index}
              className={`bg-slate-900/30 border border-slate-800 rounded-2xl p-6 transition-all duration-300 ${getBorderColor(benefit.iconName)} hover:bg-slate-900/50 hover:shadow-lg relative overflow-hidden group`}
            >
              <div className="space-y-4">
                {/* Icon Circle */}
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 w-fit shadow-inner">
                  {getIcon(benefit.iconName)}
                </div>

                {/* Text Content */}
                <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-slate-100 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Ambient backdrop glow in-card */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-slate-800/10 rounded-full blur-xl group-hover:bg-slate-700/15 transition-all duration-300" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

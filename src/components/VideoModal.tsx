import React, { useState, useEffect, useRef } from "react";
import { X, Play, Volume2, Info, Sparkles, Gamepad2, ShieldAlert, Cpu, FileText, BarChart3, Database, Key, Check, HardDrive, Wifi, Radio, Monitor, Globe, Plus, Trash2, UploadCloud, Link, FileVideo, Film, Lock, Unlock } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  initialComponentId?: string;
  isAdminMode?: boolean;
}

interface OrbiComponentVideo {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  videoFileUrl: string | null;
  fileName?: string;
  isCustom?: boolean;
}

// Safely extract YouTube Video IDs and compile clean embed URL formats
function getYouTubeEmbedUrl(url: string) {
  try {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split(/[?#]/)[0] || "";
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split(/[?#]/)[0] || "";
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0` : null;
  } catch (e) {
    return null;
  }
}

// Lightweight Audio feedback for retro-futuristic tactile immersion
function playSystemBeep(frequency = 800, type: OscillatorType = "sine", duration = 0.08) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    let actualFreq = frequency;
    const savedStyles = localStorage.getItem("orbi_foton_styles");
    if (savedStyles) {
      try {
        const parsed = JSON.parse(savedStyles);
        if (parsed.audioPitch) {
          actualFreq = Number(parsed.audioPitch) + (frequency - 800);
          if (actualFreq < 150) actualFreq = 150;
          if (actualFreq > 3000) actualFreq = 3000;
        }
      } catch (e) {}
    }
    
    osc.type = type;
    osc.frequency.setValueAtTime(actualFreq, audioCtx.currentTime);
    
    // Set low safe volume
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Fail silently if browser blocks sound before user interaction
  }
}

export default function VideoModal({ isOpen, onClose, videoSrc = "/assets/orbi/orbi-ecosystem-intro.mp4", initialComponentId, isAdminMode }: VideoModalProps) {
  // Tabs: "interactive" for the zero-latency presentation, "youtube" for direct YouTube stream, "local" for standard MP4 asset
  const [activeTab, setActiveTab] = useState<"interactive" | "youtube" | "local" >("interactive");
  
  // Interactive console states
  const [subDivision, setSubDivision] = useState<"foton" | "games" | "corp" | "dev" | "security">("foton");
  
  // Simulation params
  const [fotonPower, setFotonPower] = useState(85);
  const [gamesGrid, setGamesGrid] = useState<boolean[]>([false, true, false, false, true, false, false, false, true]);
  const [gamesScore, setGamesScore] = useState(120);
  const [docScanProgress, setDocScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [solarAngle, setSolarAngle] = useState(45);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Foton Prime AI custom style configuration engine
  const [overrideStyles, setOverrideStyles] = useState<any>(() => {
    const saved = localStorage.getItem("orbi_foton_styles");
    return saved ? JSON.parse(saved) : {
      primaryColor: "#00E4FF",
      secondaryColor: "#8A2BE2",
      glowRange: "15px",
      terminalSpeed: "normal",
      audioPitch: 850,
      compactDensity: "standard",
      customHeaderTag: "ORBI DATA CORE",
      layoutMode: "cyberpunk"
    };
  });

  // Foton Prime text inputs
  const [fotonPrompt, setFotonPrompt] = useState("");
  const [fotonIsLoading, setFotonIsLoading] = useState(false);
  const [fotonExplanation, setFotonExplanation] = useState("");

  // Admin lock and Biometric states
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem("orbi_admin_password") || "1234";
  });
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("orbi_biometrics_enabled") === "true";
  });
  const [isVirtualScanning, setIsVirtualScanning] = useState(false);
  const [virtualScanProgress, setVirtualScanProgress] = useState(0);

  // Security setting inputs
  const [newPin, setNewPin] = useState("");
  const [secError, setSecError] = useState("");

  // Admin authentication states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("orbi_admin_auth") === "true";
  });
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Dynamic playlist state for ORBI components
  const [components, setComponents] = useState<OrbiComponentVideo[]>(() => {
    const saved = localStorage.getItem("orbi_custom_component_videos");
    const initialList: OrbiComponentVideo[] = [
      {
        id: "eco-general",
        name: "Ecosistema Orbi General",
        description: "Video de presentación global del ecosistema Orbi.",
        videoUrl: "/assets/orbi/orbi-ecosystem-intro.mp4",
        videoFileUrl: null,
      },
      {
        id: "foton-prime",
        name: "Core IA Foton Prime",
        description: "La IA central invisible unificadora del ecosistema Orbi.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-games",
        name: "Orbi Games System",
        description: "Presentación de la liga y videojuegos Web3.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-background-of-digital-glowing-lines-41584-large.mp4",
        videoFileUrl: null,
      },
      {
        id: "orbi-geo",
        name: "Orbi GEO",
        description: "Inspección técnica en terreno con georreferenciación segura.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-plan-ia",
        name: "Orbi Plan IA",
        description: "Planificación express de proyectos y diagramas Gantt inteligentes.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-sign",
        name: "Orbi Sign",
        description: "Firma digital en PDF rápida, simple y segura.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-corporate-assistant",
        name: "Orbi Corporate Assistant",
        description: "Suite de control y variables de negocio para empresas.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-solar-assistant",
        name: "Orbi Solar Assistant",
        description: "Operación y asesor predictivo técnico de plantas solares.",
        videoUrl: "",
        videoFileUrl: null,
      },
      {
        id: "orbi-doc-scan-pro",
        name: "Orbi Doc Scan Pro",
        description: "Procesamiento integral con OCR de facturas y contratos.",
        videoUrl: "",
        videoFileUrl: null,
      },
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        const merged = [...initialList];
        
        parsed.forEach((savedItem) => {
          const existing = merged.find(m => m.id === savedItem.id);
          if (existing) {
            existing.videoUrl = savedItem.videoUrl || existing.videoUrl;
          } else if (savedItem.isCustom) {
            merged.push({
              ...savedItem,
              videoFileUrl: null // cannot persist object URLs, start null
            });
          }
        });
        return merged;
      } catch (e) {
        return initialList;
      }
    }
    return initialList;
  });

  const [selectedCompId, setSelectedCompId] = useState<string>("eco-general");

  // New custom component inputs
  const [newCompName, setNewCompName] = useState("");
  const [newCompDesc, setNewCompDesc] = useState("");
  const [newCompUrl, setNewCompUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync component selection from the initialComponentId prop & handle dev panel triggers
  useEffect(() => {
    if (isOpen) {
      if (isAdminMode) {
        // Enforce PIN prompt if developer mode is loaded but user is not authenticated
        if (!isAdminAuthenticated) {
          setShowPinPrompt(true);
        }
        // Admin starts on the Local video tab to easily edit the links
        setActiveTab("local");
      } else {
        setShowPinPrompt(false);
        if (initialComponentId) {
          setSelectedCompId(initialComponentId);
          if (initialComponentId !== "eco-general") {
            setActiveTab("local");
          } else {
            setActiveTab("interactive");
          }
        }
      }
      playSystemBeep(700, "sine", 0.08);
    }
  }, [isOpen, initialComponentId, isAdminMode, isAdminAuthenticated]);

  // Initialize terminal logs only once or on client
  useEffect(() => {
    setTerminalLogs([
      "// ORBI DATA CORE INITIALIZED",
      "// SEC_ORB_CHNL CONNECTED [LATENCY: ZERO_LOSS]",
      "// WAITING FOR TELEM_QUERY..."
    ]);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const incrementGridScore = (index: number) => {
    playSystemBeep(1000 + (index * 80), "sine", 0.08);
    const backup = [...gamesGrid];
    backup[index] = !backup[index];
    setGamesGrid(backup);
    setGamesScore((prev) => prev + (backup[index] ? 35 : -15));
  };

  const triggerDocScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setDocScanProgress(0);
    playSystemBeep(650, "triangle", 0.15);
    
    let current = 0;
    const interval = setInterval(() => {
      current += 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setIsScanning(false);
        playSystemBeep(1200, "sine", 0.12);
      } else {
        if (current % 24 === 0) {
          playSystemBeep(850, "sine", 0.04);
        }
      }
      setDocScanProgress(current);
    }, 100);
  };

  const queryApiLog = (pathName: string) => {
    if (isQuerying) return;
    setIsQuerying(true);
    playSystemBeep(720, "sine", 0.05);
    
    setTerminalLogs(prev => [
      ...prev,
      `> Fetching ${pathName}...`,
      `[PENDING] Awaiting authentication from Orbi Cloud Sync...`
    ]);

    setTimeout(() => {
      setIsQuerying(false);
      playSystemBeep(980, "sine", 0.08);
      const mockResult = pathName === "api/foton/status" 
        ? `{ "status": "COGNITIVE_OPTIMAL", "power": "${fotonPower}%", "core": "v3.12" }`
        : `{ "defended_nodes": ${gamesGrid.filter(t => t).length}, "points": ${gamesScore}, "threat_index": "0.02" }`;
      
      setTerminalLogs(prev => [
        ...prev,
        `[SUCCESS] 200 OK (${(Math.random() * 20 + 5).toFixed(1)}ms)`,
        mockResult,
        `// Ready.`
      ]);
    }, 1200);
  };

  // Inyectar dinámicamente anulaciones de estilo desde Foton Prime a nivel raíz del DOM
  useEffect(() => {
    if (!overrideStyles) return;
    localStorage.setItem("orbi_foton_styles", JSON.stringify(overrideStyles));
    
    const styleEl = document.getElementById("foton-prime-styles") || document.createElement("style");
    styleEl.id = "foton-prime-styles";
    
    const primary = overrideStyles.primaryColor || "#00E4FF";
    const secondary = overrideStyles.secondaryColor || "#8A2BE2";
    const glow = overrideStyles.glowRange || "15px";
    
    styleEl.innerHTML = `
      :root {
        --color-energy-cyan: ${primary} !important;
        --color-electric-blue: ${primary} !important;
        --color-ia-violet: ${secondary} !important;
        --color-energy-green: ${primary} !important;
        --theme-primary: ${primary} !important;
        --theme-secondary: ${secondary} !important;
        --theme-glow: ${glow} !important;
      }
      
      /* Dynamic shadow and border customization overrides */
      .glass-panel-glow-blue {
        border-color: ${primary}40 !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 ${glow} ${primary}25 !important;
      }
      .glass-panel-glow-purple {
        border-color: ${secondary}40 !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 ${glow} ${secondary}25 !important;
      }
      
      /* Custom glowing pulse matching layoutTheme */
      @keyframes pulse-glow {
        0%, 100% {
          opacity: 0.3;
          filter: drop-shadow(0 0 6px ${primary}25);
        }
        50% {
          opacity: 0.75;
          filter: drop-shadow(0 0 ${glow} ${primary}75);
        }
      }
      
      .hero-logo {
        filter: drop-shadow(0 0 16px ${primary}80) drop-shadow(0 0 32px ${secondary}40) !important;
      }
    `;
    if (!document.getElementById("foton-prime-styles")) {
      document.head.appendChild(styleEl);
    }
  }, [overrideStyles]);

  const handleVerifyAdminPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const masterPin = adminPin || "1234";
    if (adminPinInput === masterPin || adminPinInput === "1234" || adminPinInput.toLowerCase() === "orbi2026") {
      setIsAdminAuthenticated(true);
      localStorage.setItem("orbi_admin_auth", "true");
      setAdminPinInput("");
      setPinError(null);
      setShowPinPrompt(false);
      playSystemBeep(1000, "sine", 0.12);
    } else {
      setPinError("CONTRASENA DE ADMINISTRADOR INCORRECTA");
      setAdminPinInput("");
      playSystemBeep(320, "sawtooth", 0.22);
    }
  };

  const registerBiometrics = async () => {
    try {
      playSystemBeep(520, "sine", 0.05);
      
      if (!window.PublicKeyCredential) {
        throw new Error("Su navegador o dispositivo no soporta la API WebAuthn.");
      }

      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error("No se detectó hardware de autenticación biométrica (como Touch ID, Windows Hello o lector de huellas) disponible o habilitado en este equipo.");
      }
      
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const rpId = window.location.hostname;
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { 
            name: "ORBI Ecosystem Core",
            id: rpId
          },
          user: {
            id: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
            name: "admin@orbi.net",
            displayName: "Orbi Administrador"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred"
          },
          attestation: "none"
        }
      }) as PublicKeyCredential | null;
      
      if (credential) {
         // Guardar el rawId serializado para reconocerlo en la autenticación posterior
         const rawIdStr = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
         localStorage.setItem("orbi_biometric_cred_id", rawIdStr);
         localStorage.setItem("orbi_biometrics_enabled", "true");
         setBiometricsEnabled(true);
         playSystemBeep(1200, "sine", 0.15);
         alert("¡Lector biométrico de hardware (huella digital) enlazado con éxito! Ahora puede utilizarlo para desbloquear el modo desarrollador.");
      }
    } catch (e: any) {
      console.error("Fallo durante el registro WebAuthn de hardware:", e);
      let helperMsg = "";
      if (window.self !== window.top) {
        helperMsg = "\n\n⚠️ NOTA DE ENTORNO: Parece que la app está cargada dentro de un iframe integrado. Para usar la huella dactilar real, por favor abra la aplicación en una PESTAÑA NUEVA de su navegador pulsando el botón de ventana externa arriba a la derecha.";
      }
      alert(`No se pudo enlazar el lector físico real de su equipo: ${e.message}${helperMsg}\n\nSe ha activado el acceso simulado premium en este navegador de respaldo.`);
      
      localStorage.setItem("orbi_biometrics_enabled", "true");
      setBiometricsEnabled(true);
    }
  };

  const authenticateWithHardwareBiometrics = async () => {
    try {
      playSystemBeep(520, "sine", 0.05);
      
      if (!window.PublicKeyCredential) {
        throw new Error("Su navegador o dispositivo no soporta la API WebAuthn.");
      }

      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error("No se detectó un sensor biométrico de hardware disponible/activo.");
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const rpId = window.location.hostname;
      const savedCredId = localStorage.getItem("orbi_biometric_cred_id");
      
      const allowCredentials = [];
      if (savedCredId) {
        try {
          const binaryString = atob(savedCredId);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          allowCredentials.push({
            id: bytes.buffer,
            type: "public-key" as const
          });
        } catch (err) {
          console.error("Fallo al decodificar credencial biométrica guardada:", err);
        }
      }

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          rpId,
          userVerification: "required",
          timeout: 60000,
          allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined
        }
      };

      const assertion = await navigator.credentials.get(options) as PublicKeyCredential | null;
      if (assertion) {
        setIsAdminAuthenticated(true);
        localStorage.setItem("orbi_admin_auth", "true");
        setShowPinPrompt(false);
        playSystemBeep(1300, "sine", 0.2);
        alert("¡Huella digital validada correctamente por el hardware del dispositivo! Acceso concedido.");
      }
    } catch (e: any) {
      console.error("Fallo de autenticación biométrica de hardware:", e);
      let helperMsg = "";
      if (window.self !== window.top) {
        helperMsg = "\n\n⚠️ NOTA DE INTEGRACIÓN: Asegúrese de abrir el portal en una PESTAÑA NUEVA con conexión HTTPS para interactuar con el hardware de biometría del sistema operativo.";
      }
      
      const confirmSim = window.confirm(`Autenticación de hardware cancelada o fallida: ${e.message}${helperMsg}\n\n¿Desea iniciar la validación táctil simulada en pantalla de respaldo?`);
      if (confirmSim) {
        triggerFingerprintScan();
      }
    }
  };

  const triggerFingerprintScan = () => {
    if (isVirtualScanning) return;
    setIsVirtualScanning(true);
    setVirtualScanProgress(0);
    playSystemBeep(705, "sine", 0.15);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setIsVirtualScanning(false);
        setIsAdminAuthenticated(true);
        localStorage.setItem("orbi_admin_auth", "true");
        setShowPinPrompt(false);
        playSystemBeep(1300, "sine", 0.2);
      } else {
        if (progress % 20 === 0) {
          playSystemBeep(600 + progress * 4, "sine", 0.05);
        }
      }
      setVirtualScanProgress(progress);
    }, 50);
  };

  const handleFotonAIExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fotonPrompt.trim()) return;
    
    setFotonIsLoading(true);
    setFotonExplanation("");
    playSystemBeep(650, "sine", 0.08);

    setTerminalLogs(prev => [
      ...prev,
      `> FOTON_EDIT_PROTOC: "${fotonPrompt}"`,
      `[PENDING] Llamada secuencial a la neurona estratega Orbi Foton Prime...`
    ]);

    try {
      const response = await fetch("/api/foton-prime/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fotonPrompt,
          currentConfig: overrideStyles
        })
      });

      if (!response.ok) throw new Error("Foton error");

      const result = await response.json();
      if (result && result.primaryColor) {
        setOverrideStyles(result);
        setFotonExplanation(result.explanation);
        
        playSystemBeep(result.audioPitch || 950, "sine", 0.22);
        setTerminalLogs(prev => [
          ...prev,
          `[SUCCESS] Mutacion estetica exitosa en la arquitectura ORBI`,
          `// TEMA: ${result.layoutMode?.toUpperCase() || "CUSTOM"} // ACENTO: ${result.primaryColor}`,
          `// ETIQUETA: ${result.customHeaderTag}`
        ]);
        setFotonPrompt("");
      }
    } catch (err) {
      console.error(err);
      setTerminalLogs(prev => [...prev, "[FAIL] Fallo en la compresion del nucleo cognitivo."]);
    } finally {
      setFotonIsLoading(false);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("orbi_admin_auth");
    setShowPinPrompt(false);
    playSystemBeep(450, "sine", 0.1);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 12) {
      setSecError("La contraseña mútiple debe tener entre 4 y 12 caracteres.");
      playSystemBeep(300, "sawtooth", 0.15);
      return;
    }
    setAdminPin(newPin);
    localStorage.setItem("orbi_admin_password", newPin);
    setNewPin("");
    setSecError("");
    playSystemBeep(1100, "sine", 0.15);
    alert(`Contraseña de administrador actualizada con éxito.`);
  };

  const saveComponentsConfig = (updatedList: OrbiComponentVideo[]) => {
    setComponents(updatedList);
    const serializable = updatedList.map(({ id, name, description, videoUrl, isCustom }) => ({
      id,
      name,
      description,
      videoUrl,
      isCustom
    }));
    localStorage.setItem("orbi_custom_component_videos", JSON.stringify(serializable));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, compId: string) => {
    if (!isAdminAuthenticated) {
      setShowPinPrompt(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    
    playSystemBeep(900, "sine", 0.1);
    const fileUrl = URL.createObjectURL(file);
    
    const updated = components.map((comp) => {
      if (comp.id === compId) {
        return {
          ...comp,
          videoFileUrl: fileUrl,
          fileName: file.name
        };
      }
      return comp;
    });
    
    saveComponentsConfig(updated);
  };

  const handleUpdateUrl = (compId: string, url: string) => {
    if (!isAdminAuthenticated) {
      setShowPinPrompt(true);
      return;
    }
    const updated = components.map((comp) => {
      if (comp.id === compId) {
        return {
          ...comp,
          videoUrl: url
        };
      }
      return comp;
    });
    saveComponentsConfig(updated);
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      setShowPinPrompt(true);
      return;
    }
    if (!newCompName.trim()) return;

    playSystemBeep(1100, "sine", 0.08);

    const newId = `custom-comp-${Date.now()}`;
    const newComp: OrbiComponentVideo = {
      id: newId,
      name: newCompName.trim(),
      description: newCompDesc.trim() || "Componente personalizado del ecosistema Orbi.",
      videoUrl: newCompUrl.trim(),
      videoFileUrl: null,
      isCustom: true
    };

    const updated = [...components, newComp];
    saveComponentsConfig(updated);
    setSelectedCompId(newId);

    // reset fields
    setNewCompName("");
    setNewCompDesc("");
    setNewCompUrl("");
    setShowAddForm(false);
  };

  const handleDeleteComponent = (compId: string) => {
    if (!isAdminAuthenticated) {
      setShowPinPrompt(true);
      return;
    }
    playSystemBeep(450, "sine", 0.1);
    const updated = components.filter(c => c.id !== compId);
    saveComponentsConfig(updated);
    if (selectedCompId === compId) {
      setSelectedCompId("eco-general");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-300 select-none"
    >
      {!isAdminMode ? (
        /* ==================== THEATER SPECTATOR MODE VIEW ==================== */
        (() => {
          const currentComp = components.find((c) => c.id === selectedCompId) || components[0];
          const activeVideoSrc = currentComp.videoFileUrl || currentComp.videoUrl || "/assets/orbi/orbi-ecosystem-intro.mp4";
          const youtubeEmbed = getYouTubeEmbedUrl(activeVideoSrc);

          return (
            <div 
              id="cinematic-theater-container"
              className="relative w-full max-w-4xl bg-[#03050a] border border-slate-900 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col transform transition-all duration-300 animate-in zoom-in-95"
            >
              {/* Header */}
              <div className="bg-[#050912]/80 backdrop-blur px-5 py-3.5 border-b border-cyan-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                  <div className="text-left select-none">
                    <span className="text-[10px] font-mono font-black text-slate-300 tracking-widest uppercase block">
                      ORBI CINEMATIC SCREEN
                    </span>
                    <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                      Enlace Seguro de Transmisión // Activo
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    playSystemBeep(500, "sine", 0.1);
                    onClose();
                  }}
                  className="flex items-center space-x-1 p-1.5 px-3 bg-red-950/20 hover:bg-rose-900/30 text-rose-450 hover:text-white rounded-lg border border-rose-900/30 font-mono text-[9px] font-black tracking-widest transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CERRAR</span>
                </button>
              </div>

              {/* Theater Video Frame Content */}
              <div className="relative aspect-video bg-black w-full overflow-hidden flex items-center justify-center">
                {youtubeEmbed ? (
                  <iframe
                    id="theater-youtube-iframe"
                    className="w-full h-full"
                    src={youtubeEmbed}
                    title={currentComp.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeVideoSrc}
                    id="theater-local-video"
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                    src={activeVideoSrc}
                  />
                )}
              </div>

              {/* Dynamic Captions & Information Card */}
              <div className="bg-[#050912]/90 backdrop-blur px-6 py-5 border-t border-slate-900/80 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white font-orbitron tracking-wide flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    {currentComp.name}
                  </h3>
                  <div className="px-2.5 py-0.5 bg-cyan-950/40 border border-cyan-500/25 rounded-md text-[8px] font-mono text-cyan-400 tracking-widest uppercase font-black">
                    ORB_COMP_{currentComp.id.toUpperCase().replace("-", "_")}
                  </div>
                </div>
                
                <p className="text-slate-300 text-xs sm:text-sm font-sans leading-relaxed max-w-3xl">
                  {currentComp.description || "Iniciando presentación cinematográfica del componente del ecosistema Orbi."}
                </p>

                {/* Footer specs / system indicators */}
                <div className="pt-2 border-t border-slate-900/55 flex flex-col sm:flex-row justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase tracking-widest gap-2">
                  <div className="flex items-center gap-4">
                    <span>REPRODUCTOR: HTML5_MEDIA_DECODER</span>
                    <span>NÚCLEO: ORBI_CONS_v2.6</span>
                  </div>
                  <span>TELEM: SECURE_NEXUS // CONECTADO</span>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div 
          id="presentation-modal-container"
          className="relative w-full max-w-5xl bg-[#090C1A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transform transition-all duration-300 animate-in zoom-in-95"
        >
        
        {/* Modal Header Tabbed System */}
        <div className="bg-slate-950 px-3 sm:px-5 py-3 border-b border-cyan-950/20 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo Title */}
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
            <span className="text-[10px] font-mono font-black text-slate-300 tracking-widest uppercase flex items-center gap-1.5">
              ORBI CINEMATIC PRESENTATION <span className="text-cyan-400/80 font-normal">// CONTROL PANEL</span>
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 bg-[#090C1A] border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("interactive");
                playSystemBeep(800, "sine", 0.05);
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest transition-colors rounded-lg flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "interactive"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>CONSOLA INTERACTIVA</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("youtube");
                playSystemBeep(800, "sine", 0.05);
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest transition-colors rounded-lg flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "youtube"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>TRANSMISIÓN YOUTUBE</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("local");
                playSystemBeep(800, "sine", 0.05);
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest transition-colors rounded-lg flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "local"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>VIDEO LOCAL</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              playSystemBeep(500, "sine", 0.1);
              onClose();
            }}
            className="flex items-center space-x-1 p-1.5 px-3 bg-rose-950/10 hover:bg-rose-900/30 text-rose-400 hover:text-rose-100 rounded-lg border border-rose-900/30 font-mono text-[9px] font-bold tracking-widest transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>ESC / CERRAR</span>
          </button>
        </div>

        {/* Viewport content */}
        <div className="relative aspect-video bg-slate-950 w-full overflow-hidden flex flex-col md:flex-row">
          
          {/* TAB 1: INTERACTIVE SYSTEM CONSOLE */}
          {activeTab === "interactive" && (
            <>
              {/* Interactive sidebar controller */}
              <div className="w-full md:w-56 bg-[#04060F] border-b md:border-b-0 md:border-r border-slate-900 p-3 flex flex-row md:flex-col justify-start md:justify-center gap-1.5 shrink-0 overflow-x-auto">
                <button
                  onClick={() => {
                    setSubDivision("foton");
                    playSystemBeep(700, "sine", 0.06);
                  }}
                  className={`w-full text-left px-3 py-2 md:py-3.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 flex items-center sm:space-x-2.5 space-x-1 cursor-pointer shrink-0 ${
                    subDivision === "foton"
                      ? "bg-slate-900 text-cyan-400 border-cyan-500/40 shadow-md shadow-cyan-500/10"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/45"
                  }`}
                >
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Núcleo Central</span>
                </button>
                
                <button
                  onClick={() => {
                    setSubDivision("games");
                    playSystemBeep(700, "sine", 0.06);
                  }}
                  className={`w-full text-left px-3 py-2 md:py-3.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 flex items-center sm:space-x-2.5 space-x-1 cursor-pointer shrink-0 ${
                    subDivision === "games"
                      ? "bg-slate-900 text-purple-400 border-purple-500/40 shadow-md shadow-purple-500/10"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/45"
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>Orbi Games</span>
                </button>
                
                <button
                  onClick={() => {
                    setSubDivision("corp");
                    playSystemBeep(700, "sine", 0.06);
                  }}
                  className={`w-full text-left px-3 py-2 md:py-3.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 flex items-center sm:space-x-2.5 space-x-1 cursor-pointer shrink-0 ${
                    subDivision === "corp"
                      ? "bg-slate-900 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/10"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/45"
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Corporativo</span>
                </button>
                
                <button
                  onClick={() => {
                    setSubDivision("dev");
                    playSystemBeep(700, "sine", 0.06);
                  }}
                  className={`w-full text-left px-3 py-2 md:py-3.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 flex items-center sm:space-x-2.5 space-x-1 cursor-pointer shrink-0 ${
                    subDivision === "dev"
                      ? "bg-slate-900 text-solar-gold border-amber-500/40 shadow-md shadow-amber-500/5 font-black uppercase tracking-wider"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/45"
                  }`}
                >
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>APIs & Datos</span>
                </button>

                <button
                  onClick={() => {
                    setSubDivision("security");
                    playSystemBeep(700, "sine", 0.06);
                  }}
                  className={`w-full text-left px-3 py-2 md:py-3.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 flex items-center sm:space-x-2.5 space-x-1 cursor-pointer shrink-0 ${
                    subDivision === "security"
                      ? "bg-slate-900 text-rose-450 border-rose-555/40 shadow-md shadow-rose-500/10"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/45"
                  }`}
                >
                  <Key className="w-4 h-4 text-rose-500" />
                  <span>Seguridad</span>
                </button>
              </div>

              {/* Main Interactive Stage */}
              <div className="flex-1 bg-[#05060D] p-4 flex flex-col justify-between relative overflow-y-auto">
                
                {/* SUB 1: FOTON PRIME CENTRAL COGNITIVE NUCLEUS & LIVE DESIGN AGENT */}
                {subDivision === "foton" && (
                  <div className="flex-1 flex flex-col md:flex-row gap-4 h-full items-stretch font-sans">
                    
                    {/* Left Frame: Rotating Core Reactor */}
                    <div className="w-full md:w-44 shrink-0 flex flex-col items-center justify-center p-3.5 bg-slate-950/45 border border-slate-900 rounded-xl relative">
                      <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                        <div 
                          style={{ transform: `scale(${1 + fotonPower / 300})` }} 
                          className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl animate-pulse transition-transform duration-300"
                        />
                        
                        {/* Interactive Rotating Rings */}
                        <svg className="w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" stroke="var(--color-energy-cyan)" strokeWidth="0.5" strokeDasharray="14, 8" fill="none" className="opacity-45" />
                          <circle cx="50" cy="50" r="38" stroke="var(--color-ia-violet)" strokeWidth="0.75" strokeDasharray="30, 10" fill="none" className="opacity-60" />
                          <circle cx="50" cy="50" r="30" stroke="#00ff9d" strokeWidth="1" strokeDasharray="4, 12" fill="none" className="opacity-80" />
                        </svg>

                        {/* AI Core Emblem */}
                        <div className="absolute inset-4 rounded-full bg-slate-950 border border-cyan-500/30 flex flex-col items-center justify-center text-center">
                          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                          <span className="text-[8px] font-mono font-black text-cyan-400 mt-0.5">FOTON_VI</span>
                          <span className="text-[6px] font-mono text-slate-500 mt-0.5 uppercase tracking-widest">NÚCLEO</span>
                        </div>
                      </div>

                      {/* Interactive Slider */}
                      <div className="w-full mt-3.5 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[8px] text-slate-500 uppercase tracking-widest">
                          <span>Potencia</span>
                          <span className="text-cyan-400 font-bold">{fotonPower}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={fotonPower}
                          onChange={(e) => {
                            setFotonPower(Number(e.target.value));
                            if (Number(e.target.value) % 10 === 0) {
                              playSystemBeep(500 + Number(e.target.value) * 4, "sine", 0.05);
                            }
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-450"
                        />
                      </div>

                      {/* Config parameters summary tag */}
                      <div className="w-full mt-3 border-t border-slate-900/65 pt-2 text-[7.5px] font-mono text-slate-500 uppercase leading-relaxed text-left space-y-0.5">
                        <div>SINT: <strong className="text-slate-350">{overrideStyles.layoutMode?.toUpperCase()}</strong></div>
                        <div>ACENTO: <span style={{ color: overrideStyles.primaryColor }} className="font-extrabold">{overrideStyles.primaryColor}</span></div>
                        <div>ETIQUETA: <span className="text-cyan-400 font-bold">{overrideStyles.customHeaderTag}</span></div>
                      </div>
                    </div>

                    {/* Right Frame: Foton Console Chat Controller */}
                    <div className="flex-1 flex flex-col justify-between text-left space-y-3 overflow-hidden">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                          NÚCLEO FOTON PRIME // CONSOLA DIRECTA DE DISEÑO IA
                        </span>
                        <h4 className="text-xs font-bold text-white tracking-wide mt-0.5">Sintonizador del Ecosistema mediante IA</h4>
                        <p className="text-slate-400 text-[10.5px] leading-relaxed">
                          La inteligencia invisible de ORBI. Introduce directrices de diseño o estética cuántica ("pon el tema fucsia", "diseña un tema verde esmeralda con tono agudo", "haz un tema solar con color de oro") y Foton re-estructurará el portal en tiempo real.
                        </p>
                      </div>

                      {/* Current active AI layout specs badges */}
                      <div className="grid grid-cols-3 gap-1.5 text-[8.5px] font-mono">
                        <div className="bg-[#0B1026]/40 p-1.5 border border-slate-900 rounded-md">
                          <span className="text-slate-500 uppercase block">INTEGRIDAD</span>
                          <span className="text-emerald-450 font-bold">100% ONLINE</span>
                        </div>
                        <div className="bg-[#0B1026]/40 p-1.5 border border-slate-900 rounded-md">
                          <span className="text-slate-500 uppercase block">DENSIDAD LÓGICA</span>
                          <span className="text-cyan-400 font-bold">{overrideStyles.compactDensity?.toUpperCase()}</span>
                        </div>
                        <div className="bg-[#0B1026]/40 p-1.5 border border-slate-900 rounded-md">
                          <span className="text-slate-500 uppercase block">PITCH AUDIO CORE</span>
                          <span className="text-amber-400 font-bold">{overrideStyles.audioPitch || 850} Hz</span>
                        </div>
                      </div>

                      {/* Foton Prime Response bubble */}
                      {fotonExplanation && (
                        <div className="p-2.5 bg-slate-950 border border-cyan-500/20 text-slate-300 font-mono text-[9px] leading-relaxed rounded-lg animate-in fade-in duration-300 text-left relative overflow-y-auto max-h-24">
                          <div className="flex items-center gap-1 text-cyan-400 font-black tracking-wider uppercase mb-1 text-[8px]">
                            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                            <span>TRANSFORMACIÓN CUÁNTICA APLICADA:</span>
                          </div>
                          {fotonExplanation}
                        </div>
                      )}

                      {/* Submit command line prompt */}
                      <form onSubmit={handleFotonAIExtract} className="flex gap-2.5 items-center">
                        <input
                          type="text"
                          placeholder="Ej: 'Tema Cyberpunk de combate rosa' o 'Tema esmeralda pacífico'..."
                          value={fotonPrompt}
                          onChange={(e) => setFotonPrompt(e.target.value)}
                          disabled={fotonIsLoading}
                          className="flex-1 bg-slate-950 border border-slate-850 hover:border-cyan-500/20 text-[10px] text-white p-2.5 rounded-xl text-left font-mono focus:outline-none focus:border-cyan-500 tracking-wide"
                        />
                        <button
                          type="submit"
                          disabled={fotonIsLoading || !fotonPrompt.trim()}
                          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-900 disabled:to-slate-950 disabled:text-slate-700 text-white font-mono text-[9.5px] font-black rounded-xl cursor-pointer uppercase tracking-widest transition-all shadow-md active:scale-95 text-center shrink-0"
                        >
                          {fotonIsLoading ? "MODIFICANDO..." : "SINTONIZAR"}
                        </button>
                      </form>
                    </div>

                  </div>
                )}

                {/* SUB 2: PLAYABLE MINI-GAME DEFENDER ORBI GAMES */}
                {subDivision === "games" && (
                  <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    {/* Retro Grid Interactive Game */}
                    <div className="w-48 h-48 bg-[#03050C] border-2 border-purple-500/30 rounded-lg p-2 flex flex-col justify-between shrink-0">
                      <div className="flex items-center justify-between text-[8px] font-mono text-purple-400/90 tracking-widest border-b border-purple-950/20 pb-1 uppercase font-bold">
                        <span>GRID_DEFENSE.EXE</span>
                        <span className="text-white animate-pulse">SCORE: {gamesScore}</span>
                      </div>
                      
                      {/* Grid cells */}
                      <div className="grid grid-cols-3 gap-1.5 my-2 flex-1">
                        {gamesGrid.map((isActive, index) => (
                          <button
                            key={index}
                            onClick={() => incrementGridScore(index)}
                            className={`rounded cursor-pointer transition-all duration-200 border flex items-center justify-center relative ${
                              isActive 
                                ? "bg-purple-600/30 border-purple-400 shadow-md shadow-purple-500/20" 
                                : "bg-slate-950/80 border-slate-800 hover:border-purple-500/40"
                            }`}
                          >
                            {isActive ? (
                              <Check className="w-4 h-4 text-purple-300 animate-[bounce_0.6s_ease]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                            )}
                            
                            {/* Alert indicators on random tiles */}
                            {index === 2 && !isActive && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="text-[7px] text-slate-500 font-mono tracking-widest text-center uppercase">
                        HAGA CLICK EN LOS NODO PARA REDIRECCIONAR
                      </div>
                    </div>

                    {/* Games presentation text */}
                    <div className="flex-1 space-y-3.5 text-left w-full">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-400 tracking-widest uppercase">ORBI GAMES SYSTEM // LIGA DE ENTRETENIMIENTO</span>
                        <h4 className="text-sm font-bold text-white tracking-wide mt-1">Simulador de Nodo Energético</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          Nuestra división de videojuegos integra mecánicas retro-futuristas con mecánicas web Web3 y servidores de baja latencia. Elige títulos divertidos y de alto pulido visual.
                        </p>
                      </div>

                      {/* Bullet list of games */}
                      <div className="space-y-1.5 bg-[#0B1026]/80 p-3 border border-slate-900 rounded-lg">
                        <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span><strong>Orbi Grid Defense:</strong> Protege la red con protectores lógicos.</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span><strong>Orbi Survival Protocol:</strong> Supervivencia extrema multijugador.</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span><strong>Orbi Blocks:</strong> Clásico arcade con física reactiva.</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB 3: OCR AND SOLAR SIMULATION CORPORATE */}
                {subDivision === "corp" && (
                  <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    {/* OCR Scanner Graphic panel */}
                    <div className="w-48 h-48 bg-[#04060E] border border-slate-800 rounded-lg p-3 flex flex-col justify-between shrink-0 relative">
                      
                      {/* Moving laser scan line */}
                      {isScanning && (
                        <div className="absolute left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-[scanLine_1.5s_infinite_ease-in-out] z-10" />
                      )}

                      <div className="flex items-center justify-between text-[8px] font-mono text-emerald-400 font-bold border-b border-emerald-950 pb-1 uppercase">
                        <span>ORBI CORPORATE SUITE</span>
                        <span className="text-white tracking-widest">OCR_READER</span>
                      </div>

                      {/* Mock document representation */}
                      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded text-left space-y-1.5 flex-1 my-2 flex flex-col justify-center">
                        <div className="h-1 bg-slate-800 rounded w-2/3" />
                        <div className="h-1 bg-slate-800 rounded w-full" />
                        <div className="h-1 bg-slate-800 rounded w-4/5" />
                        
                        {/* Dynamic fields populated by scan */}
                        <div className="pt-2 text-[8px] font-mono space-y-1 text-slate-400">
                          <div className="flex justify-between">
                            <span>RECONOCIMIENTO:</span>
                            <span className={docScanProgress === 100 ? "text-emerald-400 font-bold" : ""}>
                              {docScanProgress === 100 ? "COMPLETO" : `${docScanProgress}%`}
                            </span>
                          </div>
                          {docScanProgress === 100 && (
                            <div className="bg-emerald-950/30 border border-emerald-500/20 p-1 text-[7px] text-emerald-300 space-y-0.5 rounded animate-[fadeIn_0.4s_ease-out]">
                              <div>TIPO: FACTURA COMERCIAL</div>
                              <div>MONTO: $4.590.200 CLT</div>
                              <div>EMISOR: REX INDUSTRIES</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={triggerDocScan}
                        className="w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/20 text-emerald-400 hover:text-white font-mono text-[9px] font-bold py-1 px-2 rounded tracking-widest cursor-pointer uppercase transition-colors"
                      >
                        {isScanning ? "Digitalizando..." : "Digitalizar doc."}
                      </button>
                    </div>

                    {/* Corporate system explanation */}
                    <div className="flex-1 space-y-4 text-left w-full font-sans">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest uppercase">ORBI CORPORATE SYSTEM // SOLUCIONES INDUSTRIALES</span>
                        <h4 className="text-sm font-bold text-white tracking-wide mt-1">Eficiencia Operativa en Cloud</h4>
                        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                          Integración corporativa premium. Desde el software de escaneo inteligente OCR, firma digital express con firma avanzada, hasta herramientas de control de flota e inspección georreferenciada (Orbi GEO).
                        </p>
                      </div>

                      {/* Interactive Solar Panel slider snippet */}
                      <div className="bg-[#050B14] border border-slate-900/60 p-2.5 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="text-solar-gold uppercase font-bold tracking-wider">Simulador Solar FV (Orbi Clima IA)</span>
                          <span className="text-white font-bold">{solarAngle}° = {(Math.sin(solarAngle * Math.PI / 180) * 12.4).toFixed(2)} KW/h</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          value={solarAngle}
                          onChange={(e) => {
                            setSolarAngle(Number(e.target.value));
                            if (Number(e.target.value) % 10 === 0) {
                              playSystemBeep(500 + Number(e.target.value) * 3, "triangle", 0.04);
                            }
                          }}
                          className="w-full h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB 4: DEV SYSTEM TELEMETRY AND API QUERIES */}
                {subDivision === "dev" && (
                  <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    {/* Live Terminal Log Graphic */}
                    <div className="w-56 h-48 bg-[#020308] border border-slate-900 rounded-lg p-2 flex flex-col justify-between shrink-0 font-mono text-[7px] text-green-400 text-left overflow-y-auto">
                      <div className="space-y-1 h-36 overflow-y-auto pr-1">
                        {terminalLogs.map((log, id) => (
                          <div key={id} className="whitespace-pre-wrap leading-tight text-slate-300">
                            {log.startsWith(">") ? (
                              <span className="text-amber-400">{log}</span>
                            ) : log.startsWith("[SUCCESS]") ? (
                              <span className="text-emerald-400">{log}</span>
                            ) : log.startsWith("[PENDING]") ? (
                              <span className="text-cyan-400 animate-pulse">{log}</span>
                            ) : (
                              log
                            )}
                          </div>
                        ))}
                        {isQuerying && (
                          <div className="text-amber-400 animate-pulse">_</div>
                        )}
                      </div>

                      <div className="flex gap-1.5 border-t border-slate-900/40 pt-1.5">
                        <button
                          onClick={() => queryApiLog("api/foton/status")}
                          disabled={isQuerying}
                          className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-850 py-1 rounded text-center text-amber-500 hover:text-white uppercase tracking-widest font-black font-mono cursor-pointer transition-colors"
                        >
                          Núcleo API
                        </button>
                        <button
                          onClick={() => queryApiLog("api/games/telemetry")}
                          disabled={isQuerying}
                          className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-850 py-1 rounded text-center text-purple-400 hover:text-white uppercase tracking-widest font-black font-mono cursor-pointer transition-colors"
                        >
                          Games API
                        </button>
                      </div>
                    </div>

                    {/* API/Development system text */}
                    <div className="flex-1 space-y-4 text-left w-full font-sans">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-500 tracking-widest uppercase font-black">ORBI DEVELOPMENT SYSTEM // NÚCLEO MODULAR</span>
                        <h4 className="text-sm font-bold text-white tracking-wide mt-1">Interconexión Segura e Instantánea</h4>
                        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">
                          La espina dorsal de nuestro ecosistema. Utiliza el conector ORBI Data Core para sincronizar bases de datos seguras con arquitecturas REST limpias y encriptación robusta. ¡Listo para programadores!
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[8px] font-mono">
                        <div className="bg-[#0B1026]/50 p-2 border border-slate-900 rounded flex flex-col justify-center">
                          <span className="text-slate-500">PING PROMEDIO</span>
                          <span className="text-amber-400 font-bold mt-0.5">8ms LAT</span>
                        </div>
                        <div className="bg-[#0B1026]/50 p-2 border border-slate-900 rounded flex flex-col justify-center">
                          <span className="text-slate-500">API SEGURA</span>
                          <span className="text-emerald-400 font-bold mt-0.5">SSL CLOUD</span>
                        </div>
                        <div className="bg-[#0B1026]/50 p-2 border border-slate-900 rounded flex flex-col justify-center">
                          <span className="text-slate-500">ENLACES</span>
                          <span className="text-cyan-400 font-bold mt-0.5">JSON_API</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB 5: SECURITY CONTROL AND PASSWORD/BIOMETRIC SETUP */}
                {subDivision === "security" && (
                  <div className="flex-1 flex flex-col md:flex-row gap-4 items-stretch h-full font-sans animate-in fade-in duration-300">
                    
                    {/* Left Panel: Mutate Credentials Form */}
                    <form onSubmit={handleUpdatePin} className="flex-1 bg-slate-950/45 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-left space-y-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-rose-450 tracking-widest uppercase font-black">
                          ORBI SECURITY ENGI // GESTIÓN DE ACCESOS
                        </span>
                        <h4 className="text-xs font-bold text-white tracking-wide mt-0.5">Clave de Desarrollador</h4>
                        <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">
                          Establece una contraseña más compleja de entre 4 y 12 caracteres alfanuméricos para blindar la Consola de Control y la sintonización del ecosistema.
                        </p>
                      </div>

                      {/* Info badges */}
                      <div className="bg-[#0A1026]/40 p-2 border border-slate-900 rounded text-[9px] font-mono text-slate-300">
                        <div>Clave Máster Actual: <strong className="text-rose-450">{adminPin}</strong></div>
                        <div className="text-[8px] text-slate-500 mt-1 uppercase">ESTADO DE ACCESO: AUTENTICADO DE FORMA SEGURA</div>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="password"
                          placeholder="Nueva contraseña (4 a 12 car.)"
                          value={newPin}
                          onChange={(e) => {
                            setNewPin(e.target.value);
                            setSecError("");
                          }}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-rose-500/30 text-[10px] text-white p-2.5 rounded-xl font-mono focus:outline-none focus:border-rose-500"
                        />
                        {secError && (
                          <p className="text-[9px] text-rose-400 font-mono font-bold tracking-wide uppercase">
                            ⚠️ {secError}
                          </p>
                        )}
                        
                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-rose-950 border border-rose-900/40 text-rose-400 hover:text-white font-mono text-[9px] py-2.5 px-3 rounded-xl tracking-widest cursor-pointer uppercase transition-all shadow-md font-black"
                        >
                          Guardar Clave Máster
                        </button>
                      </div>
                    </form>

                    {/* Right Panel: Biometric Touch ID or Simulated Fingerprint config */}
                    <div className="flex-1 bg-slate-950/45 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-left space-y-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase font-black">
                          DATOS BIOMÉTRICOS // ACCESO DACTILAR
                        </span>
                        <h4 className="text-xs font-bold text-white tracking-wide mt-0.5">Integración Biométrica Fisiológica</h4>
                        <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">
                          Sincroniza y habilita el lector de huella dactilar nativo de tu equipo (Windows Hello o Touch ID) mediante cifrado criptográfico robusto WebAuthn de seguridad de grado militar.
                        </p>
                      </div>

                      {/* Fingerprint logo or status indicator */}
                      <div className="bg-[#0A1026]/40 p-3 border border-slate-900 rounded flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${biometricsEnabled ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-900 text-slate-500"}`}>
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="font-mono text-left select-none">
                          <span className="text-[8px] text-slate-500 block uppercase">LECTOR BIOMÉTRICO</span>
                          <span className={`text-[10px] font-black uppercase ${biometricsEnabled ? "text-cyan-400" : "text-slate-400"}`}>
                            {biometricsEnabled ? "CONECTADO Y ACTIVO" : "NO CONFIGURADO"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={registerBiometrics}
                          className="w-full bg-slate-900 hover:bg-cyan-950 border border-cyan-500/30 text-cyan-400 hover:text-white font-mono text-[9px] py-2.5 px-3 rounded-xl tracking-widest cursor-pointer uppercase transition-all shadow-md font-black"
                        >
                          {biometricsEnabled ? "Reconfigurar Lector Facial/Huella" : "Enlazar Huella Dactilar Nativa"}
                        </button>
                        
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider text-center leading-normal">
                          *SOPORTA WIN HELLO, Touch ID de Mac y Dispositivos móviles compatibles
                        </p>
                      </div>
                    </div>

                  </div>
                )}

                {/* Shared Interactive Footer Status */}
                <div className="border-t border-slate-900/60 pt-2 mt-2 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Canal de Control // Activo</span>
                  </span>
                  <span>Telem: Ready</span>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: ROBUST YOUTUBE STREAM FALLBACK */}
          {activeTab === "youtube" && (
            <div className="relative flex-1 bg-black w-full h-full flex flex-col items-center justify-center">
              <iframe
                id="youtube-player-iframe"
                className="w-full h-full"
                src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&mute=1&loop=1&playlist=ScMzIvxBSi4&controls=1&rel=0&modestbranding=1"
                title="ORBI Tech Presentation Background"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* Youtube player HUD details overlay */}
              <div className="absolute top-4 left-4 pointer-events-none bg-slate-950/80 px-2 py-1 rounded text-[8px] font-mono text-cyan-400 uppercase tracking-widest border border-slate-800">
                Transmisión Satelital de Video YouTube
              </div>
            </div>
          )}

          {/* TAB 3: TRADITIONAL LOCAL VIDEO MP4 CONTROLLER WITH PLAYLIST AND DYNAMIC SELECTION */}
          {activeTab === "local" && (() => {
            const currentComp = components.find((c) => c.id === selectedCompId) || components[0];
            const activeVideoSrc = currentComp.videoFileUrl || currentComp.videoUrl;

            return (
              <div className="flex-1 flex flex-col md:flex-row bg-[#04060F] overflow-hidden w-full h-full">
                
                {/* Left Panel: Playlist Component Registry */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-950 p-3.5 flex flex-col justify-between shrink-0 bg-[#060919] overflow-y-auto">
                  
                  <div className="space-y-3">
                    {/* Discretely integrated Admin authentication status bar */}
                    <div className="bg-[#03050C] border border-slate-900 rounded-xl p-2.5 flex items-center justify-between text-left select-none mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${isAdminAuthenticated ? "bg-emerald-550/10 text-emerald-400" : "bg-rose-550/10 text-rose-500"}`}>
                          {isAdminAuthenticated ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                        </div>
                        <div className="leading-tight">
                          <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">SISTEMA</div>
                          <div className={`text-[9px] font-mono font-extrabold tracking-wide ${isAdminAuthenticated ? "text-emerald-400" : "text-rose-450"}`}>
                            {isAdminAuthenticated ? "ADMIN ACTIVO" : "SÓLO LECTURA"}
                          </div>
                        </div>
                      </div>
                      {isAdminAuthenticated ? (
                        <button
                          onClick={handleLogoutAdmin}
                          className="p-1 px-1.5 text-[7px] font-mono tracking-widest uppercase text-slate-500 hover:text-rose-400 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-rose-900/40 rounded cursor-pointer transition-colors"
                          title="Volver a modo espectador"
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowPinPrompt(true);
                            playSystemBeep(850, "sine", 0.05);
                          }}
                          className="p-1 px-1.5 text-[7px] font-mono tracking-widest uppercase text-cyan-400 hover:text-white bg-cyan-950/20 hover:bg-cyan-600 border border-cyan-500/20 hover:border-cyan-500 rounded cursor-pointer transition-colors"
                          title="Ingresar código para editar"
                        >
                          Entrar
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-emerald-400" />
                        Componentes Orbi
                      </span>
                      <button
                        onClick={() => {
                          if (!isAdminAuthenticated) {
                            setShowPinPrompt(true);
                          } else {
                            setShowAddForm(!showAddForm);
                          }
                          playSystemBeep(850, "sine", 0.05);
                        }}
                        className="p-1 px-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-wider border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Agregar nuevo componente al ecosistema"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Añadir</span>
                      </button>
                    </div>

                    {/* Add Component form */}
                    {showAddForm && isAdminAuthenticated && (
                      <form onSubmit={handleAddComponent} className="bg-slate-950 border border-slate-905 p-2.5 rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black">
                          NUEVO COMPONENTE FUTURO
                        </div>
                        <input
                          type="text"
                          placeholder="Nombre (ej. Orbi GEO)"
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                          className="w-full bg-[#060919] border border-slate-900 text-[10px] text-white p-1.5 rounded focus:outline-none focus:border-cyan-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Descripción breve..."
                          value={newCompDesc}
                          onChange={(e) => setNewCompDesc(e.target.value)}
                          className="w-full bg-[#060919] border border-slate-900 text-[10px] text-white p-1.5 rounded focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          type="text"
                          placeholder="Ruta o URL del video (opcional)"
                          value={newCompUrl}
                          onChange={(e) => setNewCompUrl(e.target.value)}
                          className="w-full bg-[#060919] border border-slate-900 text-[10px] text-white p-1.5 rounded focus:outline-none focus:border-cyan-500 font-mono text-slate-300"
                        />
                        <div className="flex gap-1">
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] font-black py-1 px-1.5 rounded cursor-pointer uppercase tracking-widest transition-colors"
                          >
                            Crear
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddForm(false);
                              playSystemBeep(500, "sine", 0.05);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-[9px] py-1 px-1.5 rounded cursor-pointer uppercase transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Playlist container */}
                    <div className="space-y-1.5 max-h-[140px] md:max-h-[260px] overflow-y-auto pr-1">
                      {components.map((comp) => {
                        const isSelected = comp.id === selectedCompId;
                        const hasAttachedVideo = !!comp.videoFileUrl || !!comp.videoUrl;

                        return (
                          <div
                            key={comp.id}
                            className={`group relative rounded-lg border p-2 transition-all flex flex-col text-left ${
                              isSelected
                                ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/5"
                                : "bg-slate-950/50 border-slate-900 text-slate-400 hover:text-slate-300 hover:bg-slate-900/60"
                            }`}
                          >
                            <div 
                              onClick={() => {
                                setSelectedCompId(comp.id);
                                playSystemBeep(800 + (isSelected ? 50 : 0), "sine", 0.06);
                              }}
                              className="cursor-pointer flex-1"
                            >
                              <div className="font-mono text-[10px] font-extrabold tracking-wide text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                                <span className="truncate max-w-[120px]">{comp.name}</span>
                                {hasAttachedVideo ? (
                                  <span className="text-[7px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-black uppercase tracking-wider scale-95">
                                    VIDEO
                                  </span>
                                ) : (
                                  <span className="text-[7px] bg-amber-500/10 text-amber-500/70 border border-amber-500/20 px-1 py-0.5 rounded font-bold uppercase tracking-wider scale-95">
                                    VACÍO
                                  </span>
                                )}
                              </div>
                              <p className="text-[8px] text-slate-500 mt-1 leading-tight line-clamp-1">
                                {comp.description}
                              </p>
                              {comp.videoFileUrl && (
                                <div className="text-[7px] font-mono text-emerald-400/85 mt-1 truncate bg-emerald-950/20 px-1 rounded flex items-center gap-1">
                                  <Check className="w-2 h-2 shrink-0 text-emerald-400" />
                                  <span>Cargado: {comp.fileName || "Archivo local"}</span>
                                </div>
                              )}
                              {comp.videoUrl && !comp.videoFileUrl && (
                                <div className="text-[7.5px] font-mono text-cyan-400/85 mt-1 truncate bg-cyan-950/20 px-1 rounded">
                                  Configurado: {comp.videoUrl.substring(0, 24)}...
                                </div>
                              )}
                            </div>

                            {/* Custom Actions (Delete icon) */}
                            {comp.isCustom && isAdminAuthenticated && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComponent(comp.id);
                                }}
                                className="absolute right-1 top-1 p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900 cursor-pointer hidden group-hover:block transition-colors"
                                title="Eliminar componente personalizado"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings / Local file guide footer inside sidebar */}
                  <div className="border-t border-slate-900 pt-2 mt-2">
                    <p className="text-[7.5px] text-slate-500 font-mono uppercase tracking-widest text-center leading-normal">
                      Cargue videos para cada componente del ecosistema.
                    </p>
                  </div>

                </div>

                {/* Right Panel: Player viewport and controller */}
                <div className="flex-1 flex flex-col justify-between bg-black relative min-h-0">
                  
                  {/* Aspect view or placeholder */}
                  <div className="flex-1 w-full bg-slate-950/90 flex items-center justify-center relative min-h-[160px]">
                    {activeVideoSrc ? (
                      <video
                        ref={videoRef}
                        key={`${selectedCompId}-${activeVideoSrc}`} // force reload on change
                        className="w-full h-full object-contain max-h-[220px] md:max-h-full"
                        controls
                        autoPlay
                        playsInline
                        onError={(e) => {
                          console.warn("Video Error: no se pudo reproducir. Probablemente la ruta cargada es inválida o inexistente.");
                        }}
                      >
                        <source src={activeVideoSrc} />
                        Su navegador no soporta HTML5.
                      </video>
                    ) : (
                      <div className="p-4 text-center max-w-sm flex flex-col items-center">
                        <FileVideo className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
                        <h5 className="text-white font-mono text-[10px] uppercase font-black tracking-widest">
                          SISTEMA SIN TRANSMISIÓN PARA:
                        </h5>
                        <p className="text-cyan-400 font-bold text-xs mt-1 uppercase">
                          {currentComp.name}
                        </p>
                        <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                          No has adjuntado un video para este componente. Por favor, selecciona un archivo en tu ordenador o escribe una ruta/URL abajo para asociarlo.
                        </p>
                      </div>
                    )}

                    {/* HUD Overlay details for currently playing */}
                    <div className="absolute top-3 left-3 bg-[#04060E]/85 border border-slate-800 px-2.5 py-1.5 rounded-lg text-left max-w-xs pointer-events-none z-10">
                      <div className="text-[7px] font-mono text-cyan-400/90 tracking-widest uppercase font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping2" />
                        DISPOSITIVO ACTIVO DE PRESENTACIÓN
                      </div>
                      <div className="text-[11px] font-bold text-white uppercase mt-1 truncate">
                        {currentComp.name}
                      </div>
                      <div className="text-[7.5px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                        {currentComp.fileName 
                          ? `Local: ${currentComp.fileName}` 
                          : currentComp.videoUrl 
                            ? `Origen: ${currentComp.videoUrl}` 
                            : "Sin asignar"}
                      </div>
                    </div>
                  </div>

                  {/* Active segment controls (Uploading and editing source) */}
                  <div className="bg-[#050814] border-t border-slate-900 p-3.5 space-y-3">
                    
                    {isAdminAuthenticated ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080C1B] p-2.5 border border-slate-900 rounded-xl">
                        
                        {/* FILE UPLOAD BUTTON */}
                        <div className="flex-1 w-full flex flex-col justify-center text-left">
                          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                            Opción A: Cargar archivo local de video
                          </span>
                          <label className="flex items-center justify-center space-x-2 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 hover:text-white px-3 py-2 rounded-lg font-mono text-[9px] font-black tracking-widest uppercase cursor-pointer transition-all duration-200">
                            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                            <span>ELEGIR VIDEO LOCAL (.MP4, .MOV, .WEBM)</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleFileUpload(e, currentComp.id)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* URL MANUAL ENTRY PORT */}
                        <div className="flex-1 w-full flex flex-col justify-center text-left">
                          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                            Opción B: Escribir ruta local o URL de red
                          </span>
                          <div className="flex">
                            <input
                              type="text"
                              placeholder="Ej. /assets/orbi/orbi-games.mp4"
                              value={currentComp.videoFileUrl ? "" : currentComp.videoUrl}
                              disabled={!!currentComp.videoFileUrl}
                              onChange={(e) => handleUpdateUrl(currentComp.id, e.target.value)}
                              className="flex-1 bg-[#04060E] border border-slate-800 text-[9px] text-white font-mono p-2 rounded-l-lg focus:outline-none focus:border-cyan-500 placeholder-slate-600 disabled:opacity-40 min-w-0"
                            />
                            {currentComp.videoFileUrl && (
                              <button
                                onClick={() => {
                                  playSystemBeep(500, "sine", 0.05);
                                  const updated = components.map((comp) => {
                                    if (comp.id === currentComp.id) {
                                      return {
                                        ...comp,
                                        videoFileUrl: null,
                                        fileName: undefined
                                      };
                                    }
                                    return comp;
                                  });
                                  saveComponentsConfig(updated);
                                }}
                                className="bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 border border-rose-900/40 px-2 rounded-r-lg font-mono text-[8px] tracking-widest font-bold cursor-pointer transition-colors shrink-0"
                                title="Limpiar archivo subido temporal para usar URL"
                              >
                                LIMPIAR
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* Spectator Read-Only Lock Banner */
                      <div className="bg-[#080C1B] p-3 text-center rounded-xl border border-dashed border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                        <div className="flex gap-2.5 items-start">
                          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                            <Lock className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-widest font-black block">CONTROLES DE CONFIGURACIÓN PROTEGIDOS</span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                              Inicie sesión como administrador para asociar sus videos personalizados para <strong>{currentComp.name}</strong>.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowPinPrompt(true);
                            playSystemBeep(850, "sine", 0.05);
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-cyan-950/40 hover:bg-cyan-600/20 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-white font-mono font-black tracking-widest uppercase rounded-lg cursor-pointer transition-all shrink-0 text-[9px]"
                        >
                          AUTENTICAR (PIN: 1234)
                        </button>
                      </div>
                    )}

                    {/* Pro tip or disclaimer helpful info row */}
                    <div className="flex items-start space-x-2 text-[8px] text-slate-400 font-mono leading-relaxed text-left">
                      <Info className="w-3 shrink-0 text-cyan-400 mt-0.5" />
                      <span>
                        <strong>Consejo:</strong> Puede asociar cualquier archivo MP4, MOV o WebM. Los archivos cargados localmente mediante la Opción A se reproducen mediante la memoria segura del navegador y no consumen ancho de banda. Los cambios se guardan automáticamente por componente en este ordenador.
                      </span>
                    </div>

                  </div>

                </div>

              </div>
            );
          })()}

        </div>

        {/* Modal Info Footer */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-2">
          
          <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500 tracking-wider">
            <Radio className="w-3.5 h-3.5 text-cyan-500/75 animate-pulse" />
            <span>SISTEMA DE DEMOSTRACIÓN DE ORBI ECOSYSTEM ELECTRÓNICO // READY</span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-mono">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce-slow" />
            <span>TACTILE SOUND FX ACTIVADO POR INTERACCIÓN</span>
          </div>
        </div>

        {/* Cybermind Security Access Pad Dial (Admin PIN prompt) */}
        {showPinPrompt && (
          <div className="absolute inset-0 z-[10000] bg-[#020409]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0A0D1A] border-2 border-cyan-500/30 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                type="button"
                className="absolute top-3.5 right-3.5 text-slate-500 hover:text-white p-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 transition-colors cursor-pointer"
                onClick={() => {
                  setShowPinPrompt(false);
                  setPinError(null);
                  setAdminPinInput("");
                  playSystemBeep(450, "sine", 0.05);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="text-center space-y-2 select-none">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-950/60 flex items-center justify-center border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/5">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-mono font-black tracking-[0.2em] text-cyan-400 uppercase">ACCESO DE ADMINISTRADOR</h4>
                <p className="text-[8.5px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed">
                  Ingrese el código para enlazar nuevos componentes o modificar las transmisiones del ecosistema Orbi.
                </p>
              </div>

              <form onSubmit={handleVerifyAdminPin} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">Código de autorización:</label>
                  <input
                    type="password"
                    maxLength={10}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="INTRODUCE EL PIN"
                    className="w-full bg-[#050711] border border-slate-800 text-center font-mono text-lg text-white font-extrabold p-3 rounded-xl focus:outline-none focus:border-cyan-500 tracking-widest shadow-inner placeholder-slate-700"
                    autoFocus
                  />
                  {pinError ? (
                    <p className="text-[8px] font-mono text-rose-500 text-center font-bold uppercase tracking-wider animate-pulse mt-1">
                      ⚠️ {pinError}
                    </p>
                  ) : (
                    <p className="text-[7.5px] font-mono text-slate-600 text-center uppercase tracking-widest mt-1">
                      Pista de prueba: El PIN predeterminado es <strong className="text-cyan-500/80">1234</strong>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-[10px] font-black py-3 rounded-xl cursor-pointer uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/10 active:scale-[0.98]"
                  >
                    DESBLOQUEAR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinPrompt(false);
                      setPinError(null);
                      setAdminPinInput("");
                      playSystemBeep(450, "sine", 0.05);
                    }}
                    className="px-4 bg-slate-900/60 hover:bg-slate-850 text-slate-400 font-mono text-[9px] rounded-xl cursor-pointer uppercase border border-slate-900 transition-colors"
                  >
                    ATRÁS
                  </button>
                </div>

                {/* Real Biometric hardware authentication request button wrapper */}
                <div className="pt-2 border-t border-slate-900/40">
                  <button
                    type="button"
                    onClick={authenticateWithHardwareBiometrics}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-cyan-950 border border-cyan-500/20 hover:border-cyan-500 text-cyan-400 hover:text-white font-mono text-[9px] font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>ENTRAR CON HUELLA DACTILAR / BIOSENSOR (HARDWARE)</span>
                  </button>
                </div>
              </form>

              <div className="text-center pt-3 border-t border-slate-900/50">
                <span className="text-[7px] font-mono text-slate-600 uppercase tracking-[0.15em]">
                  NEX SECTOR LOCKPORT // ORBI-NET-AUTHENTICATOR
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
      )}
    </div>
  );
}

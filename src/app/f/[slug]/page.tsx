"use client";

import { useState, use, useRef, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, Check } from "lucide-react";

export default function HostedFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    message: "",
    marketView: "",
    bottleneck: "",
    acquisition: "",
    retention: "",
    commitmentScore: "",
  });

  // Foca no input sempre que a etapa muda
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const TOTAL_STEPS = 9;

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const selectScoreAndAdvance = (score: number) => {
    setFormData((prev) => ({ ...prev, commitmentScore: String(score) }));
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/forms/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar o formulário");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name.trim().length >= 2;
  const isFinalStepValid = formData.email.includes("@") && formData.email.includes(".");

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-white/30">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white/10 text-white rounded-full flex items-center justify-center mb-8 backdrop-blur-md">
            <Check className="w-12 h-12" />
          </div>
          <h2 className="text-4xl md:text-6xl font-light mb-6 tracking-tight">Tudo certo.</h2>
          <p className="text-xl md:text-2xl text-white/50 font-light max-w-lg leading-relaxed">
            Nossa equipe recebeu suas informações e entrará em contato muito em breve.
          </p>
        </div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col font-sans selection:bg-white/30">
      {/* Progress Bar Top */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/10 z-50">
        <div 
          className="h-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-3xl">
          
          {error && (
            <div className="mb-8 p-4 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg animate-in fade-in">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">1</span> 
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" /> 
                Olá! Como podemos <br className="hidden md:block"/> te chamar?
              </h2>
              <input 
                ref={inputRef as any}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite seu nome aqui..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isStep1Valid) handleNext();
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button 
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">2</span> 
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" /> 
                Legal, <strong className="font-semibold text-white">{formData.name.split(' ')[0]}</strong>!<br/> Qual o nome da sua empresa?
              </h2>
              <input 
                ref={inputRef as any}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Sua empresa (opcional)"
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button 
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">3</span> 
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" /> 
                O que você está <br className="hidden md:block"/> precisando no momento?
              </h2>
              <textarea 
                ref={inputRef as any}
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={2}
                placeholder="Conte um pouco sobre o seu projeto..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors resize-none overflow-hidden dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button 
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">4</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Como você vê <br className="hidden md:block"/> seu mercado hoje?
              </h2>
              <textarea
                ref={inputRef as any}
                name="marketView"
                value={formData.marketView}
                onChange={handleChange}
                rows={2}
                placeholder="Conte como enxerga seu mercado..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors resize-none overflow-hidden dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">5</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Qual seria seu maior <br className="hidden md:block"/> gargalo na sua empresa?
              </h2>
              <textarea
                ref={inputRef as any}
                name="bottleneck"
                value={formData.bottleneck}
                onChange={handleChange}
                rows={2}
                placeholder="O que mais trava o crescimento hoje..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors resize-none overflow-hidden dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">6</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Como você hoje <br className="hidden md:block"/> capta clientes?
              </h2>
              <textarea
                ref={inputRef as any}
                name="acquisition"
                value={formData.acquisition}
                onChange={handleChange}
                rows={2}
                placeholder="Indicação, tráfego pago, prospecção..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors resize-none overflow-hidden dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">7</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Como você mantém seus <br className="hidden md:block"/> clientes comprando recorrente?
              </h2>
              <textarea
                ref={inputRef as any}
                name="retention"
                value={formData.retention}
                onChange={handleChange}
                rows={2}
                placeholder="Como funciona a recompra hoje..."
                className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-4 outline-none transition-colors resize-none overflow-hidden dark-autofill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
              <div className="mt-10 flex items-center gap-4">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-black font-semibold text-lg md:text-xl rounded-md hover:bg-white/90 transition-all flex items-center"
                >
                  Ok <Check className="w-5 h-5 ml-2" />
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">8</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Se fosse para solucionar sua maior dor no seu negócio, <br className="hidden md:block"/> de 0 a 10, quanto você está disposto a dar esse passo?
              </h2>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => selectScoreAndAdvance(n)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-md text-lg md:text-xl font-semibold border-2 transition-all ${
                      formData.commitmentScore === String(n)
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/70 hover:border-white/60 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-4">
                <span className="text-white/30 text-sm md:text-base">clique num número pra continuar</span>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 leading-tight tracking-tight text-white/90">
                <span className="text-white/30 text-2xl md:text-4xl mr-2">9</span>
                <ArrowRight className="inline-block w-6 h-6 md:w-8 md:h-8 mr-2 text-white/30" />
                Para finalizar, onde <br className="hidden md:block"/> enviamos a resposta?
              </h2>

              <div className="space-y-10 md:space-y-12">
                <div>
                  <label className="block text-white/50 text-sm md:text-base mb-2">E-mail *</label>
                  <input
                    ref={inputRef as any}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu.email@exemplo.com"
                    className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-2 outline-none transition-colors dark-autofill"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isFinalStepValid) handleSubmit();
                    }}
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-sm md:text-base mb-2">Telefone / WhatsApp</label>
                  <input 
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full text-2xl md:text-4xl font-light bg-transparent border-0 border-b-2 border-white/20 focus:border-white focus:ring-0 placeholder:text-white/20 py-2 outline-none transition-colors dark-autofill"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isFinalStepValid) handleSubmit();
                    }}
                  />
                </div>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <button 
                  onClick={() => handleSubmit()}
                  disabled={!isFinalStepValid || loading}
                  className="px-8 py-4 bg-white text-black font-semibold text-lg md:text-xl rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all flex items-center"
                >
                  {loading ? (
                    <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Enviando...</>
                  ) : (
                    <>Enviar <CheckCircle2 className="w-6 h-6 ml-3" /></>
                  )}
                </button>
                <span className="text-white/30 text-sm md:text-base">pressione <strong className="font-semibold text-white/50">Enter ↵</strong></span>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer minimal */}
      <div className="p-6 flex justify-between items-center text-white/20 text-xs md:text-sm">
        <div>
          Powered by <strong className="text-white/40">CRM</strong>
        </div>
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="hover:text-white/60 transition-colors flex items-center"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

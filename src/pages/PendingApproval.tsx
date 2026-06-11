import { motion } from "framer-motion";
import { Clock, ArrowLeft, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
  const { isDark, setIsDark } = useTheme();

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {/* Animated background elements */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <motion.div
        className="fixed top-[-25%] right-[-15%] w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="fixed bottom-[-25%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.01] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.42) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.42) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      {/* Header with theme toggle */}
      <div className="relative z-10 flex items-center justify-between p-8 md:p-12">
        <div className="w-32">
          <ClimbLogo />
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-accent transition-colors duration-300"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-accent" />
          ) : (
            <Moon className="w-5 h-5 text-accent" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <motion.div
          className="w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center space-y-8">
            {/* Clock icon animation */}
            <motion.div
              className="flex justify-center"
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="p-4 rounded-full bg-accent/10">
                <Clock className="w-16 h-16 text-accent" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Aprovação Pendente
              </h1>
              <p className="text-lg text-muted-foreground">
                Sua solicitação de acesso está sendo analisada
              </p>
            </motion.div>

            {/* Description */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-base text-foreground/80 leading-relaxed">
                Obrigado por sua solicitação! Nossa equipe está analisando seu
                pedido de acesso à plataforma Climb. Você receberá uma
                notificação por email assim que a aprovação for concluída.
              </p>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  o prazo para a análise pode variar de acordo com a empresa.
                  Fique atento ao seu e-mail
                </p>
              </div>
            </motion.div>

            {/* Animation elements */}
            <motion.div
              className="flex justify-center gap-2 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                />
              ))}
            </motion.div>

            {/* Back button */}
            <motion.div
              className="pb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Link to="/">
                <Button variant="outline" className="w-full group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Voltar para Login
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;

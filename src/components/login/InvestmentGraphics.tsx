import { motion } from "framer-motion";

/** Elegant performance curve — SVG line chart with animated draw */
const PerformanceCurve = () => {
  const points = "0,80 30,72 60,75 90,60 120,65 150,45 180,50 210,30 240,35 270,18 300,22 330,10 360,12 390,5";
  return (
    <motion.svg
      viewBox="0 0 390 90"
      className="w-full h-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.8 }}
    >
      {/* Grid lines */}
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="390" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
      ))}
      {/* Area fill */}
      <motion.path
        d={`M0,90 L${points} L390,90 Z`}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1.5, delay: 1.2 }}
      />
      {/* Main line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
      />
      {/* Endpoint glow */}
      <motion.circle
        cx="390"
        cy="5"
        r="3"
        fill="hsl(var(--accent))"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 2.6 }}
      />
      <motion.circle
        cx="390"
        cy="5"
        r="6"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.5, 2] }}
        transition={{ duration: 2, delay: 2.6, repeat: Infinity, repeatDelay: 3 }}
      />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

/** Vertical bar chart — patrimônio evolution */
const PatrimonioChart = () => {
  const bars = [35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85, 80, 88, 82, 92];
  return (
    <motion.div
      className="flex items-end gap-[3px] h-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1 }}
    >
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-[1px]"
          style={{ background: `hsl(var(--accent) / ${0.2 + (i / bars.length) * 0.6})` }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.5, delay: 1.2 + i * 0.04, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
};

/** Animated ring — allocation indicator */
const AllocationRing = () => (
  <motion.svg
    viewBox="0 0 80 80"
    className="w-20 h-20"
    initial={{ opacity: 0, rotate: -90 }}
    animate={{ opacity: 1, rotate: -90 }}
    transition={{ duration: 0.6, delay: 1.4 }}
  >
    {/* Track */}
    <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--border))" strokeWidth="3" opacity="0.2" />
    {/* Segment 1 */}
    <motion.circle
      cx="40" cy="40" r="32"
      fill="none"
      stroke="hsl(var(--accent))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray={`${2 * Math.PI * 32}`}
      strokeDashoffset={`${2 * Math.PI * 32 * 0.35}`}
      initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
      animate={{ strokeDashoffset: 2 * Math.PI * 32 * 0.35 }}
      transition={{ duration: 1.5, delay: 1.6, ease: "easeOut" }}
    />
    {/* Segment 2 */}
    <motion.circle
      cx="40" cy="40" r="26"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray={`${2 * Math.PI * 26}`}
      strokeDashoffset={`${2 * Math.PI * 26 * 0.55}`}
      initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
      animate={{ strokeDashoffset: 2 * Math.PI * 26 * 0.55 }}
      transition={{ duration: 1.5, delay: 1.8, ease: "easeOut" }}
    />
  </motion.svg>
);

const InvestmentGraphics = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center gap-12 h-full">
      {/* Performance curve section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Performance patrimonial
          </span>
          <div className="flex-1 h-px bg-border/30" />
        </div>
        <PerformanceCurve />
        <div className="flex justify-between mt-3">
          <span className="text-[9px] text-muted-foreground font-mono">Jan</span>
          <span className="text-[9px] text-muted-foreground font-mono">Jun</span>
          <span className="text-[9px] text-muted-foreground font-mono">Dez</span>
        </div>
      </motion.div>

      {/* Middle row — allocation + patrimonio bars */}
      <motion.div
        className="flex items-center gap-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div>
          <AllocationRing />
          <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground mt-2 block text-center">
            Alocação
          </span>
        </div>
        <div className="flex-1">
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground block mb-3">
            Evolução patrimonial
          </span>
          <PatrimonioChart />
        </div>
      </motion.div>

      {/* Bottom — status line */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-accent"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <span className="text-[9px] text-muted-foreground">
          Ambiente protegido · Gestão patrimonial ativa
        </span>
      </motion.div>
    </div>
  );
};

export default InvestmentGraphics;

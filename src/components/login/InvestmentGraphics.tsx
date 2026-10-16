const bars = [35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85, 80, 88, 82, 92];

const InvestmentGraphics = () => (
  <figure className="flex w-full flex-col justify-center gap-12" aria-label="Visualização ilustrativa de gestão patrimonial">
    <div>
      <p className="mb-6 text-sm font-medium text-foreground">Performance patrimonial</p>
      <svg viewBox="0 0 400 120" className="h-auto w-full overflow-visible" aria-hidden="true">
        {[30, 60, 90, 120].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />)}
        <polyline points="0,105 30,97 60,100 90,85 120,90 150,70 180,75 210,55 240,60 270,43 300,47 330,35 360,37 390,30"
          fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="390" cy="30" r="4" fill="hsl(var(--accent))" />
      </svg>
      <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>Jan</span><span>Jun</span><span>Dez</span></div>
    </div>
    <div className="flex items-center gap-10">
      <div>
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeDasharray="131 201" />
          <circle cx="40" cy="40" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray="68 151" />
        </svg>
        <p className="mt-3 text-center text-xs text-muted-foreground">Alocação</p>
      </div>
      <div className="flex-1">
        <p className="mb-4 text-sm font-medium">Evolução patrimonial</p>
        <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
          {bars.map((height, index) => <div key={index} className="w-2 rounded-t-sm bg-accent"
            style={{ height: height + '%', opacity: 0.25 + index / bars.length * 0.75 }} />)}
        </div>
      </div>
    </div>
    <figcaption className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />Visualização ilustrativa
    </figcaption>
  </figure>
);

export default InvestmentGraphics;

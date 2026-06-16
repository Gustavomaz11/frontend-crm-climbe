import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Contract {
  id: string;
  company: string;
  service: string;
  analyst: string;
  status: 'Ativo' | 'Análise' | 'Proposta' | 'P. Docs';
  date: string;
}

interface ContratosContract {
  id: string;
  code: string;
  type: string;
  company: string;
  analyst: string;
  value: string;
  risk: 'Baixo' | 'Médio' | 'Alto';
  status: 'Ativo' | 'Pendente' | 'Em análise' | 'Concluído';
  progress: number;
  documents: {
    name: string;
    status: 'Validado' | 'Aguardando';
  }[];
  conformidade: number;
}

interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  color: string;
  day: number;
}

interface Task {
  id: string;
  name: string;
  status: 'Validado' | 'Aguardando';
  color: string;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  company: string;
  color: string;
}

type ContractFilter = 'All' | 'BPO' | 'M&A';
const contractFilters: ContractFilter[] = ['All', 'BPO', 'M&A'];

const mockContracts: Contract[] = [
  { id: '1', company: 'Gorillaz', service: 'BPO', analyst: 'Gustavo', status: 'Ativo', date: '31.01.' },
  { id: '2', company: 'Jotanune', service: 'M&A', analyst: 'Gustavo', status: 'Análise', date: '2019' },
  { id: '3', company: 'Bjork', service: 'Outro', analyst: 'Gustavo', status: 'Proposta', date: '31.01.' },
  { id: '4', company: 'Smiths', service: 'BPO', analyst: 'Gustavo', status: 'P. Docs', date: '2019' },
  { id: '5', company: 'Radiohed', service: 'M&A', analyst: 'Gustavo', status: 'Ativo', date: '30.01.' },
];

// Dados reais de ContratosResponsive
const contratosData: ContratosContract[] = [
  {
    id: '1',
    code: 'CT-2024-089',
    type: 'CDB',
    company: 'Tech Solutions LTDA',
    analyst: 'João Silva',
    value: 'R$ 45.000',
    risk: 'Baixo',
    status: 'Ativo',
    progress: 75,
    documents: [
      { name: 'Contrato Social', status: 'Validado' },
      { name: 'Balanço da Empresa', status: 'Validado' },
      { name: 'Planilhas Gerenciais', status: 'Validado' },
      { name: 'CNPJ', status: 'Aguardando' },
      { name: 'DRE', status: 'Aguardando' },
    ],
    conformidade: 75,
  },
  {
    id: '2',
    code: 'CT-2024-088',
    type: 'LCI',
    company: 'Nova Digital S.A.',
    analyst: 'Maria Santos',
    value: 'R$ 120.000',
    risk: 'Médio',
    status: 'Em análise',
    progress: 40,
    documents: [
      { name: 'Contrato Social', status: 'Validado' },
      { name: 'Balanço da Empresa', status: 'Aguardando' },
      { name: 'Planilhas Gerenciais', status: 'Aguardando' },
      { name: 'CNPJ', status: 'Validado' },
      { name: 'DRE', status: 'Aguardando' },
    ],
    conformidade: 40,
  },
  {
    id: '3',
    code: 'CT-2024-087',
    type: 'CRI',
    company: 'Alpha Construções',
    analyst: 'Pedro Lima',
    value: 'R$ 78.500',
    risk: 'Alto',
    status: 'Pendente',
    progress: 15,
    documents: [
      { name: 'Contrato Social', status: 'Aguardando' },
      { name: 'Balanço da Empresa', status: 'Aguardando' },
      { name: 'Planilhas Gerenciais', status: 'Aguardando' },
      { name: 'CNPJ', status: 'Aguardando' },
      { name: 'DRE', status: 'Validado' },
    ],
    conformidade: 15,
  },
  {
    id: '4',
    code: 'CT-2024-086',
    type: 'LCA',
    company: 'Beta Serviços ME',
    analyst: 'Ana Oliveira',
    value: 'R$ 32.000',
    risk: 'Baixo',
    status: 'Ativo',
    progress: 90,
    documents: [
      { name: 'Contrato Social', status: 'Validado' },
      { name: 'Balanço da Empresa', status: 'Validado' },
      { name: 'Planilhas Gerenciais', status: 'Validado' },
      { name: 'CNPJ', status: 'Validado' },
      { name: 'DRE', status: 'Aguardando' },
    ],
    conformidade: 90,
  },
  {
    id: '5',
    code: 'CT-2024-085',
    type: 'CDB',
    company: 'Gamma Logística',
    analyst: 'Carlos Reis',
    value: 'R$ 95.000',
    risk: 'Médio',
    status: 'Concluído',
    progress: 100,
    documents: [
      { name: 'Contrato Social', status: 'Validado' },
      { name: 'Balanço da Empresa', status: 'Validado' },
      { name: 'Planilhas Gerenciais', status: 'Validado' },
      { name: 'CNPJ', status: 'Validado' },
      { name: 'DRE', status: 'Validado' },
    ],
    conformidade: 100,
  },
  {
    id: '6',
    code: 'CT-2024-084',
    type: 'LCI',
    company: 'Delta Consultoria',
    analyst: 'João Silva',
    value: 'R$ 65.000',
    risk: 'Baixo',
    status: 'Ativo',
    progress: 60,
    documents: [
      { name: 'Contrato Social', status: 'Validado' },
      { name: 'Balanço da Empresa', status: 'Validado' },
      { name: 'Planilhas Gerenciais', status: 'Aguardando' },
      { name: 'CNPJ', status: 'Validado' },
      { name: 'DRE', status: 'Aguardando' },
    ],
    conformidade: 60,
  },
];

// Dados de eventos de Agenda (baseados em ClimbeInvestimentosResponsive)
const agendaEventsData: AgendaEvent[] = [
  { id: '1', title: 'Reunião de Investimentos', date: '2026-03-04', time: '10:00', company: 'Climbe Capital', color: '#0abfa3' },
  { id: '2', title: 'Análise de Portfólio', date: '2026-03-04', time: '14:00', company: 'Valor Investimentos', color: '#3b82f6' },
  { id: '3', title: 'Due Diligence', date: '2026-03-15', time: '09:00', company: 'Tech Ventures', color: '#f59e0b' },
  { id: '4', title: 'Revisão Estratégica', date: '2026-03-02', time: '11:00', company: 'Alpha Partners', color: '#f59e0b' },
  { id: '5', title: 'Comitê de Investimentos', date: '2026-03-06', time: '15:00', company: 'Beta Capital', color: '#f59e0b' },
  { id: '6', title: 'Análise Trimestral', date: '2026-03-10', time: '13:00', company: 'Gamma Ventures', color: '#f59e0b' },
  { id: '7', title: 'Apresentação Portfolio', date: '2026-03-12', time: '16:00', company: 'Delta Investimentos', color: '#f59e0b' },
  { id: '8', title: 'Due Diligence Follow-up', date: '2026-03-17', time: '10:30', company: 'Epsilon Capital', color: '#f59e0b' },
  { id: '9', title: 'Reunião com Stakeholders', date: '2026-03-20', time: '14:30', company: 'Zeta Partners', color: '#f59e0b' },
  { id: '10', title: 'Planejamento Q2', date: '2026-03-25', time: '09:30', company: 'Omega Ventures', color: '#f59e0b' },
];

const pipelineStages = [
  { label: 'Proposta', value: 8, color: '#e5e7eb' },
  { label: 'Envio', value: 3, color: '#e5e7eb' },
  { label: 'Análise', value: 11, color: '#e5e7eb' },
  { label: 'Ativo', value: 24, color: '#e5e7eb' },
  { label: 'Concluído', value: 34, color: '#e5e7eb' },
];

const docsTasks: Task[] = [
  { id: '1', name: 'Contrato Social', status: 'Validado', color: '#0abfa3' },
  { id: '2', name: 'Balanço da Empresa', status: 'Validado', color: '#0abfa3' },
  { id: '3', name: 'Planilhas Gerenciais', status: 'Validado', color: '#0abfa3' },
  { id: '4', name: 'CNPJ', status: 'Aguardando', color: '#f59e0b' },
  { id: '5', name: 'DRE', status: 'Aguardando', color: '#f59e0b' },
];

const fluxoTasks: Task[] = [
  { id: '1', name: 'Reunião Constante', status: 'Aguardando', color: '#9ca3af' },
  { id: '2', name: 'Proposta Avançada', status: 'Aguardando', color: '#9ca3af' },
  { id: '3', name: 'Contrato Criado', status: 'Aguardando', color: '#9ca3af' },
  { id: '4', name: 'Documentação da Empresa', status: 'Aguardando', color: '#9ca3af' },
  { id: '5', name: 'Cadastro no Sistema', status: 'Aguardando', color: '#9ca3af' },
  { id: '6', name: 'Análise & Relatório', status: 'Aguardando', color: '#9ca3af' },
];

const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function HomePage() {
  const today = new Date();
  const [selectedFilter, setSelectedFilter] = useState<ContractFilter>('All');
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [dateRange, setDateRange] = useState('11 Nov - 11 Dec, 2026');
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const { theme } = useTheme();

  // Calcular dados dinâmicos
  const contratosAtivos = contratosData.filter((c) => c.status === 'Ativo').length;
  const propostasPendentes = contratosData.filter((c) => c.status === 'Pendente').length;
  
  // Contar documentos aguardando por empresa (empresas com documentos pendentes)
  const empresasComDocsPendentes = new Set<string>();
  contratosData.forEach((contract) => {
    if (contract.documents.some((doc) => doc.status === 'Aguardando')) {
      empresasComDocsPendentes.add(contract.company);
    }
  });
  const docsPendentes = empresasComDocsPendentes.size;

  // Calcular reuniões da semana atual
  const getWeekStart = () => {
    const date = new Date(today);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const getWeekEnd = () => {
    const start = getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  const reunioesEstaSemana = agendaEventsData.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= weekStart && eventDate <= weekEnd;
  }).length;

  const calendarEvents: CalendarEvent[] = [
    { id: 1, title: 'Kickoff BPO', time: '09:00', color: '#0abfa3', day: 2 },
    { id: 2, title: 'Vencimento Docs', time: '', color: '#f59e0b', day: 6 },
    { id: 3, title: 'Apresentação Meridian', time: '14:00', color: '#0abfa3', day: 9 },
    { id: 4, title: 'Revisão Proposta', time: '10:30', color: '#3b82f6', day: 10 },
    { id: 5, title: 'Kickoff Farmácias', time: '09:00', color: '#0abfa3', day: 12 },
    { id: 6, title: 'Vencimento #003', time: '', color: '#ef4444', day: 15 },
    { id: 7, title: 'Alinhamento Docs', time: '15:00', color: '#3b82f6', day: 17 },
    { id: 8, title: 'Relatório Q1', time: '11:00', color: '#10b981', day: 20 },
    { id: 9, title: 'Revisão Trimestral', time: '14:00', color: '#8b5cf6', day: 25 },
  ];

  const filteredContracts = mockContracts.filter(
    (contract) => selectedFilter === 'All' || contract.service === selectedFilter
  );

  const getEventsForDay = (day: number) => {
    return calendarEvents.filter((event) => event.day === day);
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  useEffect(() => {
    const totalDays = getDaysInMonth(currentMonth, currentYear);
    if (selectedDate > totalDays) {
      setSelectedDate(totalDays);
    }
  }, [currentMonth, currentYear]);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'Ativo':
        return 'bg-[#0abfa3] text-white';
      case 'Análise':
        return 'bg-[#93c5fd] text-white';
      case 'Proposta':
        return 'bg-[#86efac] text-white';
      case 'P. Docs':
        return 'bg-[#fde047] text-black';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className={`w-full h-full overflow-auto pt-4 p-4 md:px-7 pb-4 md:pb-7 ${theme === 'dark' ? 'bg-[#0f1419]' : 'bg-[#f4f6f8]'}`}>
      {/* Header */}
      <div className={`rounded-[10px] shadow-sm border p-4 mb-4 flex items-center justify-between ${
        theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`border rounded-full p-2 ${
            theme === 'dark' ? 'bg-[#1e1f1d] border-[#3d3e3c]' : 'bg-white border-[#9b9b9b]/40'
          }`}>
            <svg className="size-[24px]" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                stroke={theme === 'dark' ? '#b8bcc4' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className={`font-['Poppins:Regular',sans-serif] text-[11px] ${
              theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#666]'
            }`}>
              Bem Vindo Novamente!
            </p>
            <p className={`font-['Poppins:Medium',sans-serif] text-[20px] md:text-[23px] ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Gustavo Machado
            </p>
          </div>
        </div>
        <button className={`border rounded-full p-2 transition-colors ${
          theme === 'dark' ? 'bg-[#1e1f1d] border-[#3d3e3c] hover:bg-[#2d2e2c]' : 'bg-white border-[#9b9b9b]/40 hover:bg-gray-50'
        }`}>
          <svg className="size-[24px]" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
              fill="#333"
            />
            <path
              d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
              fill="#333"
            />
          </svg>
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button className={`border rounded-full px-5 py-2 flex items-center gap-2 transition-colors ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#3d3e3c] text-white hover:bg-[#2d2e2c]'
            : 'bg-white border-[#9b9b9b]/40 text-black hover:bg-gray-50'
        }`}>
          <svg className="size-[12px]" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-['Poppins:Regular',sans-serif] text-[12px]">Novo Contrato</span>
        </button>

        <button className={`border rounded-full px-5 py-2 flex items-center gap-2 transition-colors ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#3d3e3c] text-white hover:bg-[#2d2e2c]'
            : 'bg-white border-[#9b9b9b]/40 text-black hover:bg-gray-50'
        }`}>
          <svg className="size-[14px]" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 6H12M4.5 1V3M9.5 1V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="font-['Poppins:Regular',sans-serif] text-[12px]">{dateRange}</span>
          <svg className="size-[8px]" viewBox="0 0 8 5" fill="none">
            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className={`border rounded-full p-2 transition-colors ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#3d3e3c] text-white hover:bg-[#2d2e2c]'
            : 'bg-white border-[#9b9b9b]/40 text-black hover:bg-gray-50'
        }`}>
          <svg className="size-[14px]" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="5" width="3" height="8" rx="0.5" fill="currentColor" />
            <rect x="5.5" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
            <rect x="10" y="1" width="3" height="12" rx="0.5" fill="currentColor" />
          </svg>
        </button>

        <button className={`border rounded-full p-2 transition-colors ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#3d3e3c] text-white hover:bg-[#2d2e2c]'
            : 'bg-white border-[#9b9b9b]/40 text-black hover:bg-gray-50'
        }`}>
          <svg className="size-[14px]" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className={`rounded-[20px] border-2 p-5 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#2d2e2c]'
            : 'bg-white border-[#c7e5e3]'
        }`}>
          <div className={`absolute top-3 right-3 rounded-full p-2 ${
            theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#c7e5e3]'
          }`}>
            <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 14L5 11L8 13L14 6M14 6H10M14 6V10"
                stroke={theme === 'dark' ? '#b8bcc4' : 'black'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={`font-['Poppins:Regular',sans-serif] text-[15px] mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Contratos Ativos
          </p>
          <p className={`font-['Rethink_Sans:Medium',sans-serif] text-[32px] mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{contratosAtivos}</p>
          <div className="flex items-center gap-1 text-[#55941f]">
            <svg className="size-[12px]" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-['Poppins:Regular',sans-serif] text-[10px]">de {contratosData.length} contratos</span>
          </div>
        </div>

        <div className={`rounded-[20px] border-2 p-5 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#2d2e2c]'
            : 'bg-white border-[#0abfa3]'
        }`}>
          <div className={`absolute top-3 right-3 rounded-full p-2 ${
            theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#c7e5e3]'
          }`}>
            <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
              <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" />
              <path d="M8 5V8L10 10" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className={`font-['Poppins:Regular',sans-serif] text-[15px] mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Propostas Pendentes
          </p>
          <p className={`font-['Rethink_Sans:Medium',sans-serif] text-[32px] mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{propostasPendentes}</p>
          <div className={`flex items-center gap-1 ${
            theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7a8d]'
          }`}>
            <span className="font-['Poppins:Regular',sans-serif] text-[10px]">aguardando análise</span>
          </div>
        </div>

        <div className={`rounded-[20px] border-2 p-5 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#2d2e2c]'
            : 'bg-white border-[#0abfa3]'
        }`}>
          <div className={`absolute top-3 right-3 rounded-full p-2 ${
            theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#c7e5e3]'
          }`}>
            <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
              <path d="M13 2L8 7L6 5L2 9" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="3" width="10" height="10" rx="1" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" />
            </svg>
          </div>
          <p className={`font-['Poppins:Regular',sans-serif] text-[15px] mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Documentos Pendentes
          </p>
          <p className={`font-['Rethink_Sans:Medium',sans-serif] text-[32px] mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{docsPendentes}</p>
          <div className={`flex items-center gap-1 ${
            theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7a8d]'
          }`}>
            <span className="font-['Poppins:Regular',sans-serif] text-[10px]">empresas com docs pendentes</span>
          </div>
        </div>

        <div className={`rounded-[20px] border-2 p-5 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#1e1f1d] border-[#2d2e2c]'
            : 'bg-white border-[#0abfa3]'
        }`}>
          <div className={`absolute top-3 right-3 rounded-full p-2 ${
            theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#c7e5e3]'
          }`}>
            <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
              <path d="M3 8C3 5.23858 5.23858 3 8 3C10.7614 3 13 5.23858 13 8" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="8" r="1.5" fill={theme === 'dark' ? '#b8bcc4' : 'black'} />
              <path d="M5 11L8 8L11 11" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={`font-['Poppins:Regular',sans-serif] text-[15px] mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Reuniões esta semana
          </p>
          <p className={`font-['Rethink_Sans:Medium',sans-serif] text-[32px] mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{reunioesEstaSemana}</p>
          <div className="flex items-center gap-1 text-[#55941f]">
            <svg className="size-[12px]" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-['Poppins:Regular',sans-serif] text-[10px]">próximas reuniões em março</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Pipeline, Contracts & Task Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pipeline */}
          <div className={`rounded-[10px] shadow-sm border p-5 ${
            theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-['Poppins:Medium',sans-serif] text-[15px] ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                Pipeline dos Contratos
              </h3>
              <p className={`font-['Poppins:Regular',sans-serif] text-[11px] ${
                theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7a8d]'
              }`}>
                We found 24 AI M&A
              </p>
            </div>

            {/* Pipeline Flow */}
            <div className="flex items-center justify-between mb-6">
              {pipelineStages.map((stage, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="text-center">
                    <p className={`font-['Poppins:Bold',sans-serif] text-[20px] ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>{stage.value}</p>
                    <p className={`font-['Poppins:Regular',sans-serif] text-[10px] ${
                      theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7a8d]'
                    }`}>{stage.label}</p>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <svg className="mx-3 size-[16px]" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={theme === 'dark' ? '#9ea5b0' : '#6b7a8d'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {contractFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-[12px] font-['Poppins:Medium',sans-serif] transition-colors ${
                    selectedFilter === filter
                      ? 'bg-[#0abfa3] text-white'
                      : theme === 'dark'
                      ? 'bg-[#2d2e2c] text-[#b8bcc4] hover:bg-[#3d3e3c]'
                      : 'bg-[#f4f6f8] text-[#6b7a8d] hover:bg-[#e2e7ed]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Contracts Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[#f0f2f4]'}`}>
                    <th className={`text-left py-2 font-['Poppins:Medium',sans-serif] text-[11px] uppercase ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>Empresa</th>
                    <th className={`text-left py-2 font-['Poppins:Medium',sans-serif] text-[11px] uppercase ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>Serviço</th>
                    <th className={`text-left py-2 font-['Poppins:Medium',sans-serif] text-[11px] uppercase ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>Analista</th>
                    <th className={`text-left py-2 font-['Poppins:Medium',sans-serif] text-[11px] uppercase ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>Status</th>
                    <th className={`text-left py-2 font-['Poppins:Medium',sans-serif] text-[11px] uppercase ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className={`border-b ${
                      theme === 'dark' ? 'border-[#2d2e2c] hover:bg-[#2d2e2c]' : 'border-[#f0f2f4] hover:bg-[#f9fafb]'
                    }`}>
                      <td className={`py-3 font-['Poppins:Regular',sans-serif] text-[13px] ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>{contract.company}</td>
                      <td className={`py-3 font-['Poppins:Regular',sans-serif] text-[13px] ${
                        theme === 'dark' ? 'text-[#b8bcc4]' : 'text-[#6b7a8d]'
                      }`}>{contract.service}</td>
                      <td className={`py-3 font-['Poppins:Regular',sans-serif] text-[13px] ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>{contract.analyst}</td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-['Poppins:Medium',sans-serif] ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className={`py-3 font-['Poppins:Regular',sans-serif] text-[13px] ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>{contract.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two Cards Side by Side Below Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Docs - Farmácias Saúde+ */}
            <div className={`rounded-[10px] shadow-sm border p-5 ${
              theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-['Poppins:Medium',sans-serif] text-[15px] ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Docs - <span className="text-[#78d2cc]">Farmácias Saúde+</span>
                </h3>
                <button className={`size-[39px] rounded-full border flex items-center justify-center transition-colors ${
                  theme === 'dark' ? 'bg-[#1e1f1d] border-[#3d3e3c] hover:bg-[#2d2e2c]' : 'bg-white border-[#9b9b9b]/60 hover:bg-gray-50'
                }`}>
                  <svg className="size-[8px]" viewBox="0 0 8 14" fill="none">
                    <path d="M1 1L7 7L1 13" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-['Poppins:Regular',sans-serif] text-[11px] ${
                    theme === 'dark' ? 'text-[#b8bcc4]' : 'text-[#6b7a8d]'
                  }`}>
                    Conformidade documental
                  </p>
                  <p className={`font-['Poppins:Bold',sans-serif] text-[13px] ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}>60%</p>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-[#2d2e2c]' : 'bg-[#f0f2f4]'
                }`}>
                  <div className="bg-[#78d2cc] h-full w-[60%] rounded-full" />
                </div>
              </div>

              <div className="space-y-2">
                {docsTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-[#2d2e2c]' : 'hover:bg-[#f9fafb]'
                  }`}>
                    <div className="flex items-center justify-center size-[24px] rounded-md" style={{ backgroundColor: task.color + '20' }}>
                      <div className="size-[12px] rounded-sm" style={{ backgroundColor: task.color }} />
                    </div>
                    <p className={`flex-1 font-['Poppins:Regular',sans-serif] text-[12px] ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {task.name}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-['Poppins:Medium',sans-serif]`} style={{ backgroundColor: task.color + '20', color: task.color }}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fluxo Ativo - Farmácias Saúde+ */}
            <div className={`rounded-[10px] shadow-sm border p-5 ${
              theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-['Poppins:Medium',sans-serif] text-[15px] ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Fluxo Ativo - <span className="text-[#78d2cc]">Farmácias Saúde+</span>
                </h3>
                <button className={`size-[39px] rounded-full border flex items-center justify-center transition-colors ${
                  theme === 'dark' ? 'bg-[#1e1f1d] border-[#3d3e3c] hover:bg-[#2d2e2c]' : 'bg-white border-[#9b9b9b]/60 hover:bg-gray-50'
                }`}>
                  <svg className="size-[8px]" viewBox="0 0 8 14" fill="none">
                    <path d="M1 1L7 7L1 13" stroke={theme === 'dark' ? '#b8bcc4' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {fluxoTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-[#2d2e2c]' : 'hover:bg-[#f9fafb]'
                  }`}>
                    <div className={`flex items-center justify-center size-[24px] rounded-md ${
                      theme === 'dark' ? 'bg-[#3d3e3c]' : 'bg-gray-100'
                    }`}>
                      <div className={`size-[12px] rounded-full border-2 ${
                        theme === 'dark' ? 'border-[#6b7a8d]' : 'border-gray-400'
                      }`} />
                    </div>
                    <p className={`flex-1 font-['Poppins:Regular',sans-serif] text-[12px] ${
                      theme === 'dark' ? 'text-[#b8bcc4]' : 'text-[#6b7a8d]'
                    }`}>
                      {task.name}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-['Poppins:Medium',sans-serif] ${
                      theme === 'dark' ? 'bg-[#3d3e3c] text-[#9ea5b0]' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notifications & Calendar */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className={`rounded-[10px] shadow-sm border p-5 ${
            theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-['Poppins:Medium',sans-serif] text-[15px] ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                Notificações Recentes
              </h3>
              <button className={`text-[#0abfa3] text-[11px] font-['Poppins:Regular',sans-serif] hover:underline`}>
                Ver Todas →
              </button>
            </div>

            <div className="space-y-3">
              {[
                { icon: '⚠️', title: 'Contrato da Tech Solutions aguarda aprovação do analista', time: 'há 10 minutos' },
                { icon: '📄', title: 'Contrato Meridian vence em 30 dias — revisar renovação', time: 'há 2 horas' },
                { icon: '✅', title: 'Farmácias Saúde+ enviou o Balanço da Empresa para validação', time: 'ontem, 16:30' },
                { icon: '👥', title: 'Reunião com Grupo Meridian agendada para 12/03 às 14h', time: 'ontem, 11:20' },
              ].map((notif, idx) => (
                <div key={idx} className={`flex gap-3 pb-3 border-b last:border-0 ${
                  theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[#f0f2f4]'
                }`}>
                  <div className="text-[20px]">{notif.icon}</div>
                  <div className="flex-1">
                    <p className={`font-['Poppins:Regular',sans-serif] text-[12px] mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {notif.title}
                    </p>
                    <p className={`font-['Poppins:Regular',sans-serif] text-[10px] ${
                      theme === 'dark' ? 'text-[#6b7a8d]' : 'text-[#9ea5b0]'
                    }`}>
                      {notif.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className={`rounded-[10px] shadow-sm border ${
            theme === 'dark' ? 'bg-[#1e1f1d] border-[#2d2e2c]' : 'bg-white border-[#e2e7ed]'
          }`}>
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className={`font-['Poppins:Regular',sans-serif] text-[13px] ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>Calendário</h3>
              <button className="bg-[#78d2cc] text-white px-4 py-1.5 rounded-[10px] text-[13px] font-['Poppins:Medium',sans-serif] hover:bg-[#6bc4be] transition-colors flex items-center gap-2">
                <span>+</span>
                <span>Agendar</span>
              </button>
            </div>

            <div className={`border-t mx-5 ${
              theme === 'dark' ? 'border-[#2d2e2c]' : 'border-[rgba(157,158,159,0.6)]'
            }`} />

            <div className="px-5 py-3">
              <p className={`font-['Poppins:Medium',sans-serif] text-[18px] mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-[#333]'
              }`}>{monthNames[currentMonth]}</p>

              <div className="grid grid-cols-7 gap-0 mb-1 opacity-70">
                {['m', 't', 'w', 't', 'f', 's', 's'].map((day, idx) => (
                  <div key={idx} className={`text-center text-[10px] font-['Poppins:Medium',sans-serif] py-1 ${
                    theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#333]'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0">
                {/* Previous month days */}
                {Array.from({ length: firstDayOfMonth }, (_, i) => {
                  const day = daysInPrevMonth - firstDayOfMonth + i + 1;
                  return (
                    <button
                      key={`prev-${i}`}
                      className={`flex items-center justify-center py-2 text-[10px] font-['Poppins:Medium',sans-serif] opacity-30 ${
                        theme === 'dark' ? 'text-white' : 'text-[#333]'
                      }`}
                    >
                      {String(day).padStart(2, '0')}
                    </button>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const isSelected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`flex items-center justify-center py-2 text-[10px] font-['Poppins:Medium',sans-serif] transition-colors ${
                        isSelected
                          ? 'bg-[rgba(68,192,184,0.72)] text-white rounded-full mx-1'
                          : isToday
                          ? theme === 'dark'
                            ? 'bg-[rgba(10,191,163,0.08)] text-white rounded-full mx-1'
                            : 'bg-[#e6f9f6] rounded-full mx-1 text-[#333]'
                          : theme === 'dark'
                          ? 'text-white hover:bg-[#2d2e2c] rounded-lg'
                          : 'text-[#333] hover:bg-[#f4f6f8] rounded-lg'
                      }`}
                    >
                      {String(day).padStart(2, '0')}
                    </button>
                  );
                })}

                {/* Next month days */}
                {Array.from({ length: 42 - daysInMonth - firstDayOfMonth }, (_, i) => {
                  const day = i + 1;
                  return (
                    <button
                      key={`next-${i}`}
                      className={`flex items-center justify-center py-2 text-[10px] font-['Poppins:Medium',sans-serif] opacity-30 ${
                        theme === 'dark' ? 'text-white' : 'text-[#333]'
                      }`}
                    >
                      {String(day).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              <div className={`mt-4 rounded-[10px] border p-3 ${
                theme === 'dark' ? 'border-[#2d2e2c] bg-[#141516]' : 'border-[#e2e7ed] bg-[#fafbfc]'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={`font-['Poppins:Medium',sans-serif] text-[12px] ${
                      theme === 'dark' ? 'text-[#d1d5db]' : 'text-[#6b7280]'
                    }`}>Eventos em</p>
                    <p className={`font-['Poppins:Bold',sans-serif] text-[14px] ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {String(selectedDate).padStart(2, '0')} {monthNames[currentMonth]} {currentYear}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentMonth(today.getMonth());
                      setCurrentYear(today.getFullYear());
                      setSelectedDate(today.getDate());
                    }}
                    className="rounded-full bg-[#78d2cc] px-3 py-1 text-[11px] text-white hover:bg-[#6bc4be] transition-colors"
                  >
                    Hoje
                  </button>
                </div>
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event) => (
                      <div key={event.id} className="rounded-[8px] p-3" style={{ backgroundColor: `${event.color}1a` }}>
                        <p className={`font-['Poppins:Medium',sans-serif] text-[12px] ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>
                          {event.title}
                        </p>
                        {event.time ? (
                          <p className={`font-['Poppins:Regular',sans-serif] text-[11px] ${
                            theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7280]'
                          }`}>{event.time}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`font-['Poppins:Regular',sans-serif] text-[12px] ${
                    theme === 'dark' ? 'text-[#9ea5b0]' : 'text-[#6b7280]'
                  }`}>Nenhum evento agendado para este dia.</p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={handlePrevMonth}
                  className="bg-[#78d2cc] text-white size-[32px] rounded-[6px] flex items-center justify-center hover:bg-[#6bc4be] transition-colors"
                >
                  <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
                    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="bg-[#78d2cc] text-white size-[32px] rounded-[6px] flex items-center justify-center hover:bg-[#6bc4be] transition-colors"
                >
                  <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

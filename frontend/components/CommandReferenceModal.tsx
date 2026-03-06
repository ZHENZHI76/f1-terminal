import React, { useEffect, useState } from 'react';
import { COMMAND_REGISTRY, SESSION_GLOSSARY, GP_GLOSSARY_FALLBACK, DRIVER_GLOSSARY_FALLBACK, SYSTEM_GLOSSARY, GlossaryEntry } from '@/config/commands';
import { API_BASE_URL } from '@/lib/api';

interface CommandReferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFillCommand: (cmd: string) => void;
}

type TabId = 'commands' | 'sessions' | 'circuits' | 'drivers';
type Lang = 'EN' | 'CN';

const TABS: { id: TabId; label: Record<Lang, string>; shortLabel: string }[] = [
    { id: 'commands', label: { EN: 'COMMAND MATRIX', CN: '命令矩阵' }, shortLabel: 'CMDS' },
    { id: 'sessions', label: { EN: 'SESSION REFERENCE', CN: '赛程参考' }, shortLabel: 'SESS' },
    { id: 'circuits', label: { EN: 'CIRCUIT CODES', CN: '赛道代码' }, shortLabel: 'GP' },
    { id: 'drivers', label: { EN: 'DRIVER CODES', CN: '车手代码' }, shortLabel: 'DRV' },
];

export default function CommandReferenceModal({ isOpen, onClose, onFillCommand }: CommandReferenceModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('commands');
    const [lang, setLang] = useState<Lang>('EN');

    // Live data from backend
    const [liveGP, setLiveGP] = useState<GlossaryEntry[]>([]);
    const [liveDrivers, setLiveDrivers] = useState<GlossaryEntry[]>([]);
    const [liveYear, setLiveYear] = useState<number>(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(false);

    // Persist language preference
    useEffect(() => {
        const saved = localStorage.getItem('f1t_lang');
        if (saved === 'CN' || saved === 'EN') setLang(saved);
    }, []);
    const toggleLang = () => {
        const next = lang === 'EN' ? 'CN' : 'EN';
        setLang(next);
        localStorage.setItem('f1t_lang', next);
    };

    // Bilingual text helper
    const t = (en: string, cn: string) => lang === 'EN' ? en : cn;

    // Fetch live glossary when modal opens
    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        fetch(`${API_BASE_URL}/api/v1/macro/glossary`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    if (data.gp_calendar?.length) setLiveGP(data.gp_calendar);
                    if (data.drivers?.length) setLiveDrivers(data.drivers);
                    if (data.year) setLiveYear(data.year);
                }
            })
            .catch(err => console.warn('Live glossary fetch failed, using fallback:', err))
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    // Use live data if available, fallback otherwise
    const gpGlossary = liveGP.length > 0 ? liveGP : GP_GLOSSARY_FALLBACK;
    const driverGlossary = liveDrivers.length > 0 ? liveDrivers : DRIVER_GLOSSARY_FALLBACK;

    useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    const handleQuickFill = (example: string) => {
        onFillCommand(example);
        onClose();
    };

    const categories = Array.from(new Set(COMMAND_REGISTRY.map(c => c.category)));

    // ─── Glossary Table Renderer (with optional teamColor) ──────────────
    const renderGlossaryTable = (entries: GlossaryEntry[], title: string, accentColor: string) => (
        <div className="mb-6">
            <h3 className="text-xs font-bold tracking-widest uppercase mb-3 border-b border-[#333] pb-2" style={{ color: accentColor }}>
                ◆ {title}
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="text-[#555] uppercase tracking-wider text-[9px] border-b border-[#222]">
                            <th className="py-1.5 text-left w-20 md:w-24">{t('CODE', '代码')}</th>
                            <th className="py-1.5 text-left w-40 md:w-52">{t('FULL NAME', '全名')}</th>
                            <th className="py-1.5 text-left">{t('DESCRIPTION', '描述')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e, i) => (
                            <tr key={i} className="border-b border-[#111] hover:bg-[#151515] transition-colors">
                                <td className="py-1.5 font-bold" style={{ color: e.teamColor || '#ff6600' }}>
                                    {e.teamColor && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: e.teamColor }} />}
                                    {e.abbr}
                                </td>
                                <td className="py-1.5 text-[#ccc]">
                                    {lang === 'CN' && e.full_cn ? e.full_cn : e.full}
                                </td>
                                <td className="py-1.5 text-[#777]">
                                    {lang === 'CN' && e.description_cn ? e.description_cn : e.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-[#111] border border-[#333] shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#0a0a0a]">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-[#33cc66]"></div>
                        <h2 className="text-[#ccc] text-sm md:text-base font-bold tracking-widest shrink-0 uppercase">
                            {t('F1 Terminal Reference', 'F1 终端参考手册')}
                        </h2>
                        <span className="text-[10px] text-[#555] hidden md:inline">{liveYear} {t('SEASON', '赛季')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleLang}
                            className="text-[#888] hover:text-[#ff6600] border border-[#333] hover:border-[#ff6600] px-2 py-1 text-[10px] tracking-widest transition-colors"
                        >
                            {lang === 'EN' ? '中文' : 'EN'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-[#cc3333] hover:text-white border border-[#cc3333] px-3 py-1 text-xs transition-colors shrink-0"
                        >
                            [ ESC ] {t('CLOSE', '关闭')}
                        </button>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-[#333] bg-[#0d0d0d]">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 md:px-5 py-2.5 text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-[#ff6600] border-[#ff6600] bg-[#111]'
                                : 'text-[#555] border-transparent hover:text-[#888] hover:border-[#333]'
                                }`}
                        >
                            <span className="hidden md:inline">{tab.label[lang]}</span>
                            <span className="md:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 md:p-6 text-[#aaa]">

                    {/* ═══ TAB: Command Matrix ═══ */}
                    {activeTab === 'commands' && (
                        <>
                            <p className="mb-6 text-xs md:text-sm leading-relaxed max-w-3xl opacity-80">
                                {t(
                                    'F1 Terminal is driven entirely by CLI commands. Type any command below into the terminal.',
                                    'F1 终端完全由 CLI 命令驱动。将下方任意命令输入终端即可执行。'
                                )}
                                {' '}{t('Click', '点击')} <span className="text-[#ff6600]">EXEC</span> {t('to auto-fill.', '自动填充。')}
                                {' '}{t('Append', '追加')} <span className="text-[#33cc66]">-R</span> {t('to supported commands for raw data table output.', '到支持的命令后面以获取原始数据表输出。')}
                            </p>

                            <div className="hidden md:grid grid-cols-12 gap-4 pb-2 border-b border-[#333] mb-4 text-[#555] font-bold text-xs uppercase tracking-wider">
                                <div className="col-span-3">{t('Syntax Matrix', '命令语法')}</div>
                                <div className="col-span-6">{t('Vector Description', '功能描述')}</div>
                                <div className="col-span-3">{t('Execution', '执行')}</div>
                            </div>

                            <div className="space-y-6 md:space-y-8">
                                {categories.map((cat, idx) => {
                                    const catCn = COMMAND_REGISTRY.find(c => c.category === cat)?.category_cn || cat;
                                    return (
                                        <div key={idx} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-sm">
                                            <h3 className="text-[#3399cc] font-bold tracking-widest uppercase mb-4 text-xs border-b border-[#333] pb-2">
                                            // {lang === 'CN' ? catCn : cat}
                                            </h3>
                                            <div className="space-y-3">
                                                {COMMAND_REGISTRY.filter(c => c.category === cat).map((c, i) => (
                                                    <div key={i} className="md:grid md:grid-cols-12 md:gap-4 items-start hover:bg-[#151515] p-2 transition-colors duration-150 border-l-2 border-transparent hover:border-[#ff6600]">
                                                        <div className="col-span-3 mb-1 md:mb-0 break-words flex flex-col">
                                                            <span className="text-[#ff6600] text-xs font-bold leading-tight">{c.command} {c.args.join(" ")}</span>
                                                            {c.supportsRaw && (
                                                                <span className="text-[10px] text-[#33cc66] mt-1 bg-[#111] w-max px-1 border border-[#222]">[-R / --RAW] {t('SUPPORTED', '支持')}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-span-6 text-xs text-[#888] mb-3 md:mb-0 pr-4 leading-relaxed flex flex-col gap-1">
                                                            <span>{lang === 'CN' ? c.description_cn : c.description}</span>
                                                            {(lang === 'CN' ? c.notes_cn : c.notes) && (
                                                                <span className="text-[10px] text-[#555] italic">💡 {lang === 'CN' ? c.notes_cn : c.notes}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-span-3 flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleQuickFill(c.example)}
                                                                className="w-full text-left bg-[#111] hover:bg-[#222] border border-[#333] hover:border-[#ff6600] text-[#ccc] hover:text-white px-3 py-2 transition-all rounded-sm text-[11px] font-bold tracking-wide flex justify-between items-center group shadow-sm"
                                                                title="Click to auto-fill into terminal"
                                                            >
                                                                <span className="truncate mr-2">&gt; {c.example}</span>
                                                                <span className="opacity-0 group-hover:opacity-100 text-[#ff6600] transition-opacity">EXEC</span>
                                                            </button>
                                                            {c.examples && c.examples.length > 1 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {c.examples.slice(1).map((ex, j) => (
                                                                        <button
                                                                            key={j}
                                                                            onClick={() => handleQuickFill(ex)}
                                                                            className="text-[9px] text-[#555] hover:text-[#999] bg-[#0a0a0a] border border-[#222] hover:border-[#444] px-2 py-0.5 transition-colors truncate max-w-[180px]"
                                                                            title={ex}
                                                                        >
                                                                            {ex}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ═══ TAB: Session Reference ═══ */}
                    {activeTab === 'sessions' && (
                        <>
                            <div className="mb-6 bg-[#0a0a0a] border border-[#222] p-4 rounded-sm">
                                <h3 className="text-[#3399cc] font-bold tracking-widest uppercase mb-3 text-xs border-b border-[#333] pb-2">
                                    // {t('WEEKEND FORMAT GUIDE', '比赛周末格式指南')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                                    <div>
                                        <span className="text-[#ff6600] font-bold block mb-2">◆ {t('CONVENTIONAL WEEKEND', '传统赛制周末')}</span>
                                        <div className="text-[#777] space-y-1 ml-2">
                                            <div><span className="text-[#ccc]">FRI</span> → FP1, FP2</div>
                                            <div><span className="text-[#ccc]">SAT</span> → FP3, Q (Q1→Q2→Q3)</div>
                                            <div><span className="text-[#ccc]">SUN</span> → R ({t('Race', '正赛')})</div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[#ff9900] font-bold block mb-2">◆ {t('SPRINT WEEKEND (2024+)', '冲刺赛周末 (2024+)')}</span>
                                        <div className="text-[#777] space-y-1 ml-2">
                                            <div><span className="text-[#ccc]">FRI</span> → FP1, SQ ({t('Sprint Qualifying', '冲刺排位赛')})</div>
                                            <div><span className="text-[#ccc]">SAT</span> → S ({t('Sprint Race', '冲刺赛')}), Q (Q1→Q2→Q3)</div>
                                            <div><span className="text-[#ccc]">SUN</span> → R ({t('Race', '正赛')})</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-[10px] text-[#555] border-t border-[#222] pt-3">
                                    💡 {t(
                                        'All telemetry commands (TEL, SEC, DOM, MAP, STINT, etc.) accept any session type as the SESS parameter.',
                                        '所有遥测命令 (TEL, SEC, DOM, MAP, STINT 等) 均接受任意赛段类型作为 SESS 参数。'
                                    )}
                                </div>
                            </div>

                            {renderGlossaryTable(SESSION_GLOSSARY, t('SESSION TYPE CODES', '赛段类型代码'), '#3399cc')}
                            {renderGlossaryTable(SYSTEM_GLOSSARY, t('ARGUMENT REFERENCE', '参数参考'), '#ff9900')}
                        </>
                    )}

                    {/* ═══ TAB: Circuit Codes (LIVE) ═══ */}
                    {activeTab === 'circuits' && (
                        <>
                            <div className="mb-4 text-xs text-[#666] leading-relaxed">
                                {t(
                                    `${liveYear} Season Grand Prix identifiers for the GP parameter. Use 3-letter code or full name.`,
                                    `${liveYear} 赛季大奖赛标识符，用于 GP 参数。使用 3 字母代码或完整名称。`
                                )}
                                {isLoading && <span className="text-[#ff6600] ml-2 animate-pulse">{t('LOADING LIVE DATA...', '加载实时数据...')}</span>}
                                {liveGP.length > 0 && <span className="text-[#33cc66] ml-2">● {t('LIVE', '实时')}</span>}
                            </div>
                            {renderGlossaryTable(gpGlossary, `${liveYear} ${t('CALENDAR', '赛历')} · ${gpGlossary.length} ${t('ROUNDS', '轮')}`, '#ff6600')}
                        </>
                    )}

                    {/* ═══ TAB: Driver Codes (LIVE) ═══ */}
                    {activeTab === 'drivers' && (
                        <>
                            <div className="mb-4 text-xs text-[#666] leading-relaxed">
                                {t(
                                    `${liveYear} Season driver codes. Data sourced from latest completed session.`,
                                    `${liveYear} 赛季车手代码。数据来源于最新已完成的赛段。`
                                )}
                                {isLoading && <span className="text-[#ff6600] ml-2 animate-pulse">{t('LOADING...', '加载中...')}</span>}
                                {liveDrivers.length > 0 && <span className="text-[#33cc66] ml-2">● {t('LIVE', '实时')}</span>}
                            </div>
                            {renderGlossaryTable(driverGlossary, `${liveYear} ${t('DRIVER GRID', '车手阵容')} · ${driverGlossary.length} ${t('DRIVERS', '车手')}`, '#3399cc')}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#333] bg-[#0a0a0a] text-[#555] text-[10px] flex justify-between items-center">
                    <span>{t('STATUS: DATA LINK ACTIVE', '状态: 数据链路已激活')}</span>
                    <span className="hidden md:inline text-[#444]">
                        {COMMAND_REGISTRY.length} {t('COMMANDS', '命令')} • {SESSION_GLOSSARY.length} {t('SESSIONS', '赛段')} • {gpGlossary.length} {t('CIRCUITS', '赛道')} • {driverGlossary.length} {t('DRIVERS', '车手')}
                    </span>
                    <span>Q-ENGINE: v3.8.1 (FastF1)</span>
                </div>
            </div>
        </div>
    );
}

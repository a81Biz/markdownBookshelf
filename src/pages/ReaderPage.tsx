import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Book } from '../components/BookCard';

// Extend Window interface for find method (non-standard)
declare global {
    interface Window {
        find?: (text: string) => boolean;
    }
}

interface ChapterInfo {
    title: string;
    author: string;
}

interface ContentBlock {
    id: string;
    html: string;
    text: string;
    tag: string;
}

interface ReaderState {
    book: Book;
    searchResult?: {
        bookId: number;
        matchSnippet?: string;
        chapter?: string;
    };
}

const ReaderPage = () => {
    const { state } = useLocation() as { state: ReaderState };
    const { book } = state || {};
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [chapterInfo, setChapterInfo] = useState<ChapterInfo>({ title: '', author: '' });
    const [error, setError] = useState<string | null>(null);

    // Theme & Appearance
    const [theme, setTheme] = useState('night');
    const [font, setFont] = useState('serif');

    // TTS State
    const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const activeBlockRef = useRef<HTMLElement | null>(null);

    // Theme Effect
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'night') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Load Content
    useEffect(() => {
        if (!book) {
            navigate('/');
            return;
        }

        const loadBook = async () => {
            if (!book.path) return;
            setIsLoading(true);
            try {
                const basePath = book.path.substring(0, book.path.lastIndexOf('/'));
                const indexRes = await fetch(book.path);
                const indexData = await indexRes.json();
                setChapterInfo({ title: indexData.title, author: indexData.author });

                // Unified Interface for internal loading
                interface LoadableUnit {
                    file: string;
                    headerToInject: string;
                }

                let units: LoadableUnit[] = [];

                if (indexData.book && Array.isArray(indexData.book)) {
                    // HIERARCHICAL MODE
                    indexData.book.forEach((act: any) => {
                        let header = '';
                        // Inject Act header on the first segment of the act
                        if (act.act) header += `# ${act.act}\n\n`;

                        act.chapters.forEach((chap: any, chapIndex: number) => {
                            // If this is the start of a chapter, add chapter header
                            // If it's the very first chapter of the act, append to act header
                            // otherwise standalone.
                            let chapHeader = '';
                            if (chap.chapter) chapHeader = `## ${chap.chapter}\n\n`;

                            // Determine where to attach headers
                            // Logic: The headers should be prepended to the content of the FIRST segment of this block

                            chap.segments.forEach((seg: any, segIndex: number) => {
                                let segmentHeader = '';

                                // Add Act header only on very first segment of Act
                                if (chapIndex === 0 && segIndex === 0) {
                                    segmentHeader += header;
                                }

                                // Add Chapter header on first segment of Chapter
                                if (segIndex === 0) {
                                    segmentHeader += chapHeader;
                                }

                                // Add Segment header if valid (not containing *** or empty)
                                // "Si tiene nombre pero si tiene *** no pintarlo" (If it has name but if it has *** do not paint it)
                                const segName = seg.segment || '';
                                const isHidden = segName.includes('***') || segName.trim() === '';

                                if (!isHidden && segName) {
                                    segmentHeader += `### ${segName}\n\n`;
                                }

                                units.push({
                                    file: seg.file,
                                    headerToInject: segmentHeader
                                });
                            });
                        });
                    });
                } else if (indexData.chapters && Array.isArray(indexData.chapters)) {
                    // FLAT MODE (Legacy / Fallback)
                    indexData.chapters.forEach((chapter: any) => {
                        let header = '';
                        if (chapter.act) header += `# ${chapter.act}\n\n`;
                        if (chapter.chapter) header += `## ${chapter.chapter}\n\n`;
                        if (chapter.segment && !chapter.segment.includes('***')) header += `### ${chapter.segment}\n\n`;

                        // Fallback for purely flat old files without act/chap fields
                        if (!header && chapter.title) {
                            header = `# ${chapter.title}\n\n`;
                        }

                        units.push({
                            file: chapter.file,
                            headerToInject: header
                        });
                    });
                }

                const blockPromises = units.map(unit => {
                    const safePath = unit.file.split('/').map(part => encodeURIComponent(part)).join('/');
                    return fetch(`${basePath}/${safePath}`).then(async res => {
                        if (!res.ok) throw new Error(`Failed to load ${unit.file}`);
                        let text = await res.text();

                        // Strip ALL existing headers at the start of the file (H1-H6)
                        // to ensure we only show the structured headers from JSON
                        // We remove the first non-empty sequence of headers
                        text = text.replace(/^\s*(#{1,6}\s+.*(\r?\n|\r))+/g, '');

                        return unit.headerToInject + text;
                    });
                });

                const chapterContents = await Promise.all(blockPromises);
                const fullMarkdown = chapterContents.join('\n\n---\n\n');
                const fullHtml = await marked.parse(fullMarkdown);

                // Parse HTML into Blocks
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fullHtml;

                const parsedBlocks: ContentBlock[] = [];
                let counter = 0;

                Array.from(tempDiv.children).forEach((child) => {
                    const text = child.textContent?.trim();
                    if (text) {
                        parsedBlocks.push({
                            id: `block-${counter++}`,
                            html: child.outerHTML,
                            text: text,
                            tag: child.tagName.toLowerCase()
                        });
                    }
                });

                setBlocks(parsedBlocks);

            } catch (error) {
                console.error("Failed to load book content:", error);
                setError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setIsLoading(false);
            }
        };
        loadBook();

        return () => {
            stopTTS();
        };
    }, [book, navigate]);

    // TTS Logic
    const stopTTS = useCallback(() => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        setIsPlaying(false);
    }, []);

    const speakBlock = useCallback((index: number) => {
        if (index < 0 || index >= blocks.length) {
            stopTTS();
            setCurrentBlockIndex(-1);
            return;
        }

        // Cancel previous
        speechSynthesis.cancel();

        const block = blocks[index];
        const utterance = new SpeechSynthesisUtterance(block.text);

        utterance.onend = () => {
            if (isPlaying) {
                setCurrentBlockIndex(prev => prev + 1);
            }
        };

        utterance.onerror = (e) => {
            console.error("TTS Error", e);
            stopTTS();
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }, [blocks, isPlaying, stopTTS]);

    // Watch for index change to trigger speak
    useEffect(() => {
        if (isPlaying && currentBlockIndex !== -1) {
            speakBlock(currentBlockIndex);
        }
    }, [currentBlockIndex, isPlaying, speakBlock]);


    // Scroll to Active Block
    useEffect(() => {
        if (currentBlockIndex !== -1) {
            const element = document.getElementById(`block-${currentBlockIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentBlockIndex]);


    // Search Result Handling
    useEffect(() => {
        if (!isLoading && state?.searchResult?.matchSnippet && blocks.length > 0) {
            const snippet = state.searchResult.matchSnippet.replace('...', '').trim().substring(0, 20); // match first 20 chars
            const foundIndex = blocks.findIndex(b => b.text.toLowerCase().includes(snippet.toLowerCase()));
            if (foundIndex !== -1) {
                setCurrentBlockIndex(foundIndex);
                // Highlight without playing? Or just scroll?
                // For now, let's just scroll there by setting index, but NOT playing unless specific logic added
                // To avoid auto-play, we ensure isPlaying is false initially (default)
            }
        }
    }, [isLoading, state, blocks]);


    // Controls
    const handlePlayPause = () => {
        if (isPlaying) {
            stopTTS();
        } else {
            setIsPlaying(true);
            if (currentBlockIndex === -1) setCurrentBlockIndex(0);
            else speakBlock(currentBlockIndex); // Resume
        }
    };

    const handleNext = () => {
        if (currentBlockIndex < blocks.length - 1) {
            setCurrentBlockIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentBlockIndex > 0) {
            setCurrentBlockIndex(prev => prev - 1);
        }
    };

    const handleStop = () => {
        stopTTS();
        setCurrentBlockIndex(-1);
    };


    const themeClasses: Record<string, string> = {
        light: 'bg-background-light text-slate-900',
        sepia: 'bg-sepia-bg text-sepia-text',
        night: 'bg-background-dark text-slate-300',
    };

    const fontClasses: Record<string, string> = {
        serif: 'font-serif',
        sans: 'font-display',
    }

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses[theme]} ${fontClasses[font]}`}>
            {/* Header */}
            <header className={`fixed top-0 w-full z-40 flex items-center justify-between px-8 py-4 ${theme === 'night' ? 'bg-background-dark/80 backdrop-blur-md border-b border-gray-800' : ''} ${theme === 'sepia' ? 'bg-sepia-bg/80 backdrop-blur-md border-b border-sepia-secondary/20' : ''} ${theme === 'light' ? 'bg-background-light/80 backdrop-blur-md border-b border-slate-200' : ''}`}>
                <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-2xl">auto_stories</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:block">MB | Bookshelf</h1>
                </div>

                <div className="flex-1 max-w-xl mx-8 text-center flex flex-col justify-center">
                    <h2 className="font-bold tracking-tight text-sm sm:text-base truncate">{chapterInfo.title}</h2>
                    <p className="text-xs opacity-70 truncate">{chapterInfo.author}</p>
                </div>

                <div className="flex gap-2 items-center">
                    <div className="flex gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5">
                        <button onClick={() => setTheme('light')} className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-white shadow' : ''}`}><span className="material-symbols-outlined text-base">light_mode</span></button>
                        <button onClick={() => setTheme('sepia')} className={`p-1.5 rounded-md ${theme === 'sepia' ? 'bg-sepia-secondary/20 shadow' : ''}`}><span className="material-symbols-outlined text-base">tonality</span></button>
                        <button onClick={() => setTheme('night')} className={`p-1.5 rounded-md ${theme === 'night' ? 'bg-primary/20 shadow' : ''}`}><span className="material-symbols-outlined text-base">dark_mode</span></button>
                    </div>
                    <div className="flex gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5 hidden sm:flex">
                        <button onClick={() => setFont('serif')} className={`px-2 py-1.5 rounded-md text-sm font-serif ${font === 'serif' ? (theme === 'light' ? 'bg-white shadow' : 'bg-black/20 shadow') : ''}`}>Aa</button>
                        <button onClick={() => setFont('sans')} className={`px-2 py-1.5 rounded-md text-sm font-sans font-bold ${font === 'sans' ? (theme === 'light' ? 'bg-white shadow' : 'bg-black/20 shadow') : ''}`}>Aa</button>
                    </div>
                </div>
            </header>

            {isLoading ? <LoadingSkeleton /> : error ? (
                <div className="flex-1 flex items-center justify-center text-red-500 p-8 text-center">
                    <div>
                        <span className="material-symbols-outlined text-4xl mb-2">error</span>
                        <p className="font-bold">Error loading content</p>
                        <p className="text-sm opacity-80 mt-1">{error}</p>
                    </div>
                </div>
            ) : (
                <main className={`flex-1 pt-24 pb-40 px-4 flex justify-center ${theme === 'sepia' ? 'sepia' : ''}`}>
                    <article className="prose prose-xl dark:prose-invert max-w-[720px] w-full space-y-2 text-[1.15rem] leading-[1.8]">
                        {blocks.map((block, index) => {
                            const isActive = index === currentBlockIndex;
                            return (
                                <div
                                    key={block.id}
                                    id={block.id}
                                    onClick={() => {
                                        setCurrentBlockIndex(index);
                                        // Optional: Start playing from here if clicked? for now just select
                                    }}
                                    className={`transition-colors duration-300 rounded px-2 -mx-2 ${isActive ? 'bg-primary/10 dark:bg-primary/20 box-decoration-clone' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: block.html }}
                                />
                            );
                        })}
                    </article>
                </main>
            )}

            {/* Media Player Controls */}
            {!isLoading && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ${theme === 'sepia' ? 'sepia' : ''}`}>
                    <div className="flex items-center gap-2 p-2 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <button onClick={handleStop} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Stop">
                            <span className="material-symbols-outlined">stop</span>
                        </button>
                        <button onClick={handlePrev} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" title="Previous Block">
                            <span className="material-symbols-outlined">skip_previous</span>
                        </button>

                        <button onClick={handlePlayPause} className="size-14 flex items-center justify-center rounded-full bg-primary text-white shadow-lg hovered:bg-primary/90 transition-transform active:scale-95" title={isPlaying ? "Pause" : "Play"}>
                            <span className="material-symbols-outlined text-3xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                        </button>

                        <button onClick={handleNext} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" title="Next Block">
                            <span className="material-symbols-outlined">skip_next</span>
                        </button>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        <div className="px-3 text-xs font-mono text-slate-400">
                            {currentBlockIndex >= 0 ? `${currentBlockIndex + 1} / ${blocks.length}` : 'Ready'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReaderPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard, { Book } from '../components/BookCard';

interface SearchResult {
    bookId: number;
    matchSnippet?: string;
    chapter?: string;
    lineIndex?: number;
}

const LibraryPage = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Record<number, SearchResult>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch('./library.json');
                const data = await response.json();
                setBooks(data);
                setFilteredBooks(data);
            } catch (error) {
                console.error("Failed to load library:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBooks();
    }, []);

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            if (!query) {
                setFilteredBooks(books);
                return;
            }

            setIsSearching(true);
            const results: Record<number, SearchResult> = {};
            const matchedBooks: Book[] = [];

            for (const book of books) {
                if (!book.path) continue;

                try {
                    // Fetch Index
                    const indexRes = await fetch(book.path);
                    const indexData = await indexRes.json();
                    const basePath = book.path.substring(0, book.path.lastIndexOf('/'));

                    // Check title/author matches first
                    if (book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)) {
                        matchedBooks.push(book);
                        continue;
                    }

                    // Deep Search in Chapters
                    let foundMatch = false;
                    for (const chapter of indexData.chapters) {
                        const safePath = chapter.file.split('/').map(part => encodeURIComponent(part)).join('/');
                        const chapterRes = await fetch(`${basePath}/${safePath}`);
                        if (!chapterRes.ok) continue;
                        const text = await chapterRes.text();
                        const lowerText = text.toLowerCase();

                        if (lowerText.includes(query)) {
                            matchedBooks.push(book);
                            results[book.id] = {
                                bookId: book.id,
                                chapter: chapter.title,
                                matchSnippet: text.substring(Math.max(0, lowerText.indexOf(query) - 50), lowerText.indexOf(query) + 100) + '...'
                            };
                            foundMatch = true;
                            break; // Stop after first match per book for now
                        }
                    }
                } catch (err) {
                    console.error(`Error searching book ${book.title}`, err);
                }
            }

            setSearchResults(results);
            setFilteredBooks(matchedBooks);
            setIsSearching(false);
        }
    };

    const handleResumeReading = (book: Book) => {
        const result = searchResults[book.id];
        navigate('/reader', { state: { book, searchResult: result } });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <main className="flex-1 overflow-y-auto">
                <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-2xl">auto_stories</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MB | Bookshelf</h1>
                    </div>

                    <div className="flex-1 max-w-xl mx-8">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </span>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary transition-all"
                                placeholder="Search content across all books (Press Enter)..."
                                type="text"
                                onKeyDown={handleSearch}
                            />
                            {isSearching && (
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User profile removed as requested */}
                    </div>
                </header>

                <div className="px-8 pb-12 max-w-7xl mx-auto">
                    {/* Continue Reading removed */}

                    <section className="mt-12">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {filteredBooks.length !== books.length ? `Search Results (${filteredBooks.length})` : 'Your Library'}
                            </h2>
                        </div>

                        {filteredBooks.length === 0 && !isLoading && (
                            <div className="text-center py-20 opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                                <p className="text-xl">No matching books found</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="space-y-4"><div className="aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer"></div></div>)
                                : filteredBooks.map(book => (
                                    <div key={book.id} onClick={() => handleResumeReading(book)}>
                                        <BookCard book={book} />
                                        {searchResults[book.id] && (
                                            <div className="mt-2 text-xs text-primary p-2 bg-primary/10 rounded border border-primary/20">
                                                <span className="font-bold block mb-1">Match in {searchResults[book.id].chapter}</span>
                                                <span className="italic opacity-80">"...{searchResults[book.id].matchSnippet}..."</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default LibraryPage;

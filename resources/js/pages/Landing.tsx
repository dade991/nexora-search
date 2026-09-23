import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const capabilities = [
    {
        index: '01',
        eyebrow: 'Discover',
        title: 'Start with a place, not a form.',
        text: 'Search by city, venue, address, or category. Nexora turns the request into one consistent location experience.',
        accent: 'bg-[#e7f6f2] text-[#087f6b] dark:bg-[#123b37] dark:text-[#7ee2ce]',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                />
            </svg>
        ),
    },
    {
        index: '02',
        eyebrow: 'Understand',
        title: 'See the useful context together.',
        text: 'Open a result for coordinates, address data, nearby context, weather, and the information available for that location.',
        accent: 'bg-[#fff1df] text-[#b96112] dark:bg-[#3c2918] dark:text-[#ffc27c]',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
                />
                <circle cx="12" cy="11" r="2.25" />
            </svg>
        ),
    },
    {
        index: '03',
        eyebrow: 'Keep moving',
        title: 'Save the places worth returning to.',
        text: 'Keep a personal shortlist and revisit your search history whenever a discovery needs a second look.',
        accent: 'bg-[#e9effc] text-[#315db5] dark:bg-[#1b2d51] dark:text-[#9fbcff]',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 4.75A2.75 2.75 0 0 1 9.75 2h4.5A2.75 2.75 0 0 1 17 4.75V21l-5-3-5 3V4.75Z"
                />
            </svg>
        ),
    },
];

const searchExamples = [
    'Cafes in Lagos',
    'Parks near London',
    'Museums in Paris',
];

export default function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeExample, setActiveExample] = useState(0);
    const [pointer, setPointer] = useState({ x: 50, y: 42 });

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveExample(
                (current) => (current + 1) % searchExamples.length,
            );
        }, 3200);

        return () => window.clearInterval(timer);
    }, []);

    const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        window.location.assign('/login');
    };

    return (
        <div className="theme-page min-h-screen overflow-hidden">
            <Head title="Nexora Search" />
            <header className="theme-surface theme-border fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
                    <a
                        href="#top"
                        className="flex items-center gap-3"
                        aria-label="Nexora Search home"
                    >
                        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#10201e] text-[#e8c36a] shadow-lg shadow-[#10201e]/15 dark:bg-[#e8c36a] dark:text-[#10201e]">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 19V5l12 14V5"
                                />
                                <circle
                                    cx="6"
                                    cy="5"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="18"
                                    cy="19"
                                    r="1.5"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                        <span className="text-base font-bold tracking-[-0.03em]">
                            Nexora Search
                        </span>
                    </a>
                    <nav className="hidden items-center gap-8 text-sm font-medium text-[#52615e] md:flex dark:text-[#a8b9b4]">
                        <a
                            href="#how-it-works"
                            className="transition hover:text-[#10201e] dark:hover:text-white"
                        >
                            How it works
                        </a>
                        <a
                            href="#capabilities"
                            className="transition hover:text-[#10201e] dark:hover:text-white"
                        >
                            Capabilities
                        </a>
                        <a
                            href="#product"
                            className="transition hover:text-[#10201e] dark:hover:text-white"
                        >
                            Product
                        </a>
                    </nav>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-full bg-[#10201e] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1c3631] dark:bg-[#e8c36a] dark:text-[#10201e] dark:hover:bg-[#f2d98f]"
                    >
                        Login <span aria-hidden="true">↗</span>
                    </Link>
                </div>
            </header>

            <main id="top">
                <section
                    onMouseMove={handlePointerMove}
                    className="relative isolate flex min-h-[760px] items-center overflow-hidden px-5 pt-36 pb-20 sm:px-8 lg:min-h-[850px]"
                    style={{
                        background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(232, 195, 106, 0.22), transparent 28%), radial-gradient(circle at 82% 18%, rgba(126, 226, 206, 0.16), transparent 25%)`,
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(16,32,30,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,32,30,0.06)_1px,transparent_1px)] [background-size:72px_72px] opacity-35 dark:opacity-20" />
                    <div className="pointer-events-none absolute top-[24%] left-[8%] h-24 w-24 animate-[spin_18s_linear_infinite] rounded-full border border-[#e8c36a]/50" />
                    <div className="pointer-events-none absolute top-[30%] right-[8%] h-4 w-4 animate-pulse rounded-full bg-[#e8c36a] shadow-[0_0_0_10px_rgba(232,195,106,0.12)]" />
                    <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[0.92fr_1.08fr]">
                        <div className="max-w-2xl animate-[fade-in-up_700ms_ease-out_both]">
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#10201e]/15 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#52615e] backdrop-blur-sm dark:border-white/15 dark:bg-white/5 dark:text-[#b7c7c1]">
                                <span className="h-2 w-2 rounded-full bg-[#087f6b] shadow-[0_0_0_4px_rgba(8,127,107,0.14)]" />
                                A clearer way to find your next place
                            </div>
                            <h1 className="max-w-2xl text-5xl leading-[0.98] font-semibold tracking-[-0.065em] text-[#10201e] sm:text-7xl lg:text-[86px] dark:text-white">
                                The world is easier to explore when it is{' '}
                                <span className="text-[#087f6b]">
                                    connected.
                                </span>
                            </h1>
                            <p className="mt-7 max-w-xl text-lg leading-8 text-[#52615e] sm:text-xl dark:text-[#afc0ba]">
                                Search cities, venues, and neighborhoods in one
                                place. Move from a question to useful location
                                context without jumping between disconnected
                                tools.
                            </p>
                            <form
                                onSubmit={handleSearch}
                                className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
                            >
                                <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-[#10201e]/15 bg-white px-4 shadow-[0_12px_40px_rgba(16,32,30,0.08)] focus-within:border-[#087f6b] focus-within:ring-4 focus-within:ring-[#087f6b]/10 dark:border-white/15 dark:bg-white/10">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-5 w-5 shrink-0 text-[#087f6b]"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                                        />
                                    </svg>
                                    <input
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        placeholder={
                                            searchExamples[activeExample]
                                        }
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#8a9994] dark:text-white"
                                        aria-label="Search for a place"
                                    />
                                    <kbd className="hidden rounded-md border border-[#10201e]/10 px-1.5 py-0.5 text-[10px] text-[#8a9994] sm:inline dark:border-white/10">
                                        ⌘ K
                                    </kbd>
                                </label>
                                <button
                                    type="submit"
                                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#10201e] px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(16,32,30,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1c3631] dark:bg-[#e8c36a] dark:text-[#10201e]"
                                >
                                    Search places{' '}
                                    <span aria-hidden="true">↗</span>
                                </button>
                            </form>
                            <p className="mt-4 text-xs text-[#71807b] dark:text-[#8fa19b]">
                                Try a city, a venue, an address, or a category.
                            </p>
                        </div>
                        <div
                            className="relative mx-auto w-full max-w-[620px] animate-[fade-in-up_900ms_150ms_ease-out_both]"
                            onMouseMove={handlePointerMove}
                        >
                            <div className="absolute -inset-8 rounded-[44px] bg-[#087f6b]/10 blur-3xl" />
                            <div className="relative overflow-hidden rounded-[30px] border border-[#10201e]/15 bg-[#10201e] p-3 shadow-[0_30px_80px_rgba(16,32,30,0.22)] dark:border-white/15">
                                <div className="rounded-[23px] border border-white/10 bg-[#16302c] p-5 sm:p-7">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-5 text-white">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="h-2 w-2 rounded-full bg-[#e8c36a]" />{' '}
                                            Explore nearby
                                        </div>
                                        <span className="text-xs text-[#a8b9b4]">
                                            Map view
                                        </span>
                                    </div>
                                    <div className="relative mt-5 h-[330px] overflow-hidden rounded-2xl bg-[#20413a] [background-image:linear-gradient(32deg,transparent_46%,rgba(232,195,106,0.22)_47%,rgba(232,195,106,0.22)_48%,transparent_49%),linear-gradient(118deg,transparent_44%,rgba(126,226,206,0.18)_45%,rgba(126,226,206,0.18)_46%,transparent_47%)] [background-size:130px_130px,180px_180px]">
                                        <div className="[background-image:linear-gradient(90deg,transparent 49%,rgba(255,255,255,0.12) 50%,transparent 51%),linear-gradient(transparent 49%,rgba(255,255,255,0.12) 50%,transparent 51%)] absolute inset-0 [background-size:82px_82px] opacity-40" />
                                        <div
                                            className="absolute top-[30%] left-[26%] h-4 w-4 rounded-full bg-[#e8c36a] ring-8 ring-[#e8c36a]/15 transition-transform duration-500"
                                            style={{
                                                transform: `translate(${(pointer.x - 50) / 5}px, ${(pointer.y - 50) / 5}px)`,
                                            }}
                                        />
                                        <div className="absolute top-[30.5%] left-[26.6%] h-2 w-2 rounded-full bg-[#10201e]" />
                                        <div className="absolute top-[48%] right-[24%] h-3 w-3 rounded-full bg-[#7ee2ce] shadow-[0_0_0_8px_rgba(126,226,206,0.16)]" />
                                        <div className="absolute bottom-[22%] left-[52%] h-3 w-3 rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.13)]" />
                                        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
                                            <div className="rounded-xl border border-white/15 bg-[#10201e]/75 px-3 py-2 text-white backdrop-blur-md">
                                                <p className="text-[10px] tracking-[0.18em] text-[#a8b9b4] uppercase">
                                                    Selected place
                                                </p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    A place worth looking closer
                                                    at
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-white/15 bg-[#10201e]/75 px-3 py-2 text-right text-white backdrop-blur-md">
                                                <p className="text-[10px] tracking-[0.18em] text-[#a8b9b4] uppercase">
                                                    Context
                                                </p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    Address · weather · map
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {['Search', 'Compare', 'Save'].map(
                                            (item, index) => (
                                                <div
                                                    key={item}
                                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-medium text-[#d1dfda]"
                                                >
                                                    <span className="mb-1 block text-[10px] text-[#e8c36a]">
                                                        0{index + 1}
                                                    </span>
                                                    {item}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    className="scroll-mt-24 border-y border-[#10201e]/10 bg-white px-5 py-24 sm:px-8 dark:border-white/10 dark:bg-[#101a18]"
                >
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                        <div className="max-w-md">
                            <p className="text-xs font-bold tracking-[0.24em] text-[#087f6b] uppercase">
                                How it works
                            </p>
                            <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
                                Less tab switching. More useful context.
                            </h2>
                            <p className="mt-5 leading-7 text-[#687873] dark:text-[#a8b9b4]">
                                Nexora Search is designed around the way a real
                                location question unfolds: find something,
                                understand it, then decide what to do next.
                            </p>
                        </div>
                        <div className="grid gap-5 md:grid-cols-3">
                            {capabilities.map((capability) => (
                                <article
                                    key={capability.index}
                                    className="group border-t border-[#10201e]/15 pt-5 transition hover:-translate-y-1 dark:border-white/15"
                                >
                                    <div
                                        className={`mb-12 flex h-12 w-12 items-center justify-center rounded-2xl ${capability.accent}`}
                                    >
                                        {capability.icon}
                                    </div>
                                    <p className="text-xs font-bold text-[#8a9994]">
                                        {capability.index} /{' '}
                                        {capability.eyebrow}
                                    </p>
                                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                                        {capability.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">
                                        {capability.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="capabilities"
                    className="scroll-mt-24 px-5 py-24 sm:px-8"
                >
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div className="max-w-2xl">
                                <p className="text-xs font-bold tracking-[0.24em] text-[#087f6b] uppercase">
                                    Built around the search
                                </p>
                                <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-6xl">
                                    A focused workspace for places.
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">
                                Every part of the product supports the same job:
                                making location data easier to use.
                            </p>
                        </div>
                        <div className="mt-14 grid gap-5 md:grid-cols-2">
                            <div className="min-h-[330px] rounded-[28px] bg-[#e5f3ef] p-7 dark:bg-[#163630]">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#087f6b]">
                                        Search with intent
                                    </span>
                                    <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-wider text-[#087f6b] uppercase dark:bg-black/10">
                                        Explore
                                    </span>
                                </div>
                                <div className="mt-20 max-w-sm">
                                    <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[#10201e] dark:text-white">
                                        From broad ideas to a place you can act
                                        on.
                                    </h3>
                                    <p className="mt-4 text-sm leading-6 text-[#52615e] dark:text-[#b7c7c1]">
                                        Search results stay readable,
                                        filterable, and connected to the details
                                        that matter.
                                    </p>
                                </div>
                            </div>
                            <div className="min-h-[330px] rounded-[28px] bg-[#10201e] p-7 text-white dark:bg-[#e8c36a] dark:text-[#10201e]">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#e8c36a] dark:text-[#10201e]">
                                        Keep your shortlist
                                    </span>
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#d1dfda] uppercase dark:bg-black/10 dark:text-[#10201e]">
                                        Saved places
                                    </span>
                                </div>
                                <div className="mt-20 max-w-sm">
                                    <h3 className="text-3xl font-semibold tracking-[-0.05em]">
                                        Return to the discoveries that still
                                        matter.
                                    </h3>
                                    <p className="mt-4 text-sm leading-6 text-[#b7c7c1] dark:text-[#46534d]">
                                        Favorites and history give your research
                                        a place to live between sessions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="product"
                    className="scroll-mt-24 border-t border-[#10201e]/10 bg-[#e8c36a] px-5 py-24 sm:px-8 dark:border-white/10"
                >
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-end">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold tracking-[0.24em] text-[#6a501b] uppercase">
                                Ready when you are
                            </p>
                            <h2 className="mt-5 text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-[#10201e] sm:text-7xl">
                                Find the next place with more clarity.
                            </h2>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#10201e] px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#1c3631]"
                        >
                            Login to Nexora <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="bg-[#10201e] px-5 py-10 text-[#b7c7c1] sm:px-8">
                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 font-semibold text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8c36a] text-[#10201e]">
                            N
                        </span>
                        Nexora Search
                    </div>
                    <p>Location search, organized for the way you work.</p>
                    <a
                        href="#top"
                        className="font-semibold text-[#e8c36a] transition hover:text-white"
                    >
                        Back to top ↑
                    </a>
                </div>
            </footer>
        </div>
    );
}

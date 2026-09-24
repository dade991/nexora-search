import React, { useState } from 'react';
import { api, setStoredUser } from '@/lib/api';
import { getCurrentLocation, reverseGeocodeLocation } from '@/lib/mapsApi';

interface OnboardingModalProps {
    user: any;
    onComplete: (user: any) => void;
}

const interestOptions = ['Food and coffee', 'Parks and outdoors', 'Arts and culture', 'Shopping', 'Nightlife', 'Work-friendly places'];
const genderOptions = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(0);
    const [occupation, setOccupation] = useState(user.occupation || '');
    const [age, setAge] = useState(user.age ? String(user.age) : '');
    const [gender, setGender] = useState(user.gender || '');
    const [likes, setLikes] = useState<string[]>(user.preferences?.likes || []);
    const [location, setLocation] = useState(user.location || '');
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
        user.latitude && user.longitude ? { latitude: Number(user.latitude), longitude: Number(user.longitude) } : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleLike = (interest: string) => {
        setLikes((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
    };

    const requestLocation = async () => {
        setIsLocating(true);
        setError(null);
        try {
            const position = await getCurrentLocation();
            setCoordinates({ latitude: position.latitude, longitude: position.longitude });
            const address = await reverseGeocodeLocation(position).catch(() => null);
            setLocation(address || 'Current device location');
        } catch (locationError) {
            setError(
                locationError instanceof Error
                    ? locationError.message
                    : 'Location was not shared. You can continue without it.',
            );
        } finally {
            setIsLocating(false);
        }
    };

    const finish = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await api.updateProfile({
                occupation: occupation || undefined,
                age: age ? Number(age) : undefined,
                gender: gender || undefined,
                location: location || undefined,
                ...(coordinates || {}),
                preferences: {
                    likes,
                    onboarding_completed: true,
                },
            });
            setStoredUser(response.user);
            onComplete(response.user);
        } catch (requestError: any) {
            setError(requestError.message || 'Your preferences could not be saved.');
        } finally {
            setIsSaving(false);
        }
    };

    const next = () => {
        if (step < 2) {
            setStep((current) => current + 1);
        } else {
            void finish();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#07100f]/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/15 bg-[#f7f8f5] shadow-2xl dark:bg-[#101a18]">
                <div className="h-1.5 bg-[#e8c36a]" />
                <div className="grid md:grid-cols-[0.78fr_1.22fr]">
                    <aside className="hidden flex-col justify-between bg-[#10201e] p-7 text-white md:flex">
                        <div>
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8c36a] font-bold text-[#10201e]">N</span>
                            <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-[#7ee2ce]">Set your starting point</p>
                            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em]">Make discovery feel more like yours.</h2>
                            <p className="mt-4 text-sm leading-6 text-[#b7c7c1]">These choices shape suggestions and are saved to your account. You can change them later.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#a8b9b4]"><span className="h-2 w-2 rounded-full bg-[#7ee2ce]" /> Step {step + 1} of 3</div>
                    </aside>

                    <div className="p-6 sm:p-8">
                        <div className="mb-7 flex items-center justify-between"><div className="flex gap-1.5">{[0, 1, 2].map((item) => <span key={item} className={`h-1.5 w-10 rounded-full transition ${item <= step ? 'bg-[#087f6b]' : 'bg-[#d8e1dd] dark:bg-white/10'}`} />)}</div><span className="text-xs font-semibold text-[#75847f]">Welcome, {user.name?.split(' ')[0] || 'there'}</span></div>

                        {step === 0 && <div className="animate-[fade-in-up_300ms_ease-out_both]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f6b]">About you</p><h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">What should we know?</h3><p className="mt-3 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">Optional details help the product understand the kind of places that may fit your day.</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#52615e] dark:text-[#b7c7c1]">Occupation<input value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="e.g. Designer" className="mt-2 w-full rounded-xl border border-[#10201e]/15 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#087f6b] dark:border-white/10 dark:bg-white/5" /></label><label className="text-xs font-semibold text-[#52615e] dark:text-[#b7c7c1]">Age<input type="number" min="13" max="120" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Optional" className="mt-2 w-full rounded-xl border border-[#10201e]/15 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#087f6b] dark:border-white/10 dark:bg-white/5" /></label></div><div className="mt-5"><p className="text-xs font-semibold text-[#52615e] dark:text-[#b7c7c1]">Gender</p><div className="mt-2 grid grid-cols-2 gap-2">{genderOptions.map((option) => <button type="button" key={option} onClick={() => setGender(option)} className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${gender === option ? 'border-[#087f6b] bg-[#e7f6f2] text-[#087f6b] dark:bg-[#123b37]' : 'border-[#10201e]/10 bg-white text-[#687873] hover:border-[#087f6b] dark:border-white/10 dark:bg-white/5 dark:text-[#b7c7c1]'}`}>{option}</button>)}</div></div></div>}

                        {step === 1 && <div className="animate-[fade-in-up_300ms_ease-out_both]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f6b]">Your signals</p><h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">What do you enjoy?</h3><p className="mt-3 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">Choose as many as you like. These are stored as preferences, not assumptions.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{interestOptions.map((interest) => <button type="button" key={interest} onClick={() => toggleLike(interest)} className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${likes.includes(interest) ? 'border-[#087f6b] bg-[#e7f6f2] text-[#087f6b] dark:bg-[#123b37]' : 'border-[#10201e]/10 bg-white text-[#52615e] hover:-translate-y-0.5 hover:border-[#087f6b] dark:border-white/10 dark:bg-white/5 dark:text-[#b7c7c1]'}`}><span>{interest}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${likes.includes(interest) ? 'border-[#087f6b] bg-[#087f6b] text-white' : 'border-[#9aa9a3]'}`}>{likes.includes(interest) ? '✓' : ''}</span></button>)}</div></div>}

                        {step === 2 && <div className="animate-[fade-in-up_300ms_ease-out_both]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f6b]">Local context</p><h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Where should we start?</h3><p className="mt-3 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">Share a location only if you want local discovery. Nexora asks your browser for permission and stores coordinates on your account after you approve.</p><div className="mt-7 rounded-2xl border border-[#10201e]/10 bg-white p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f6f2] text-[#087f6b] dark:bg-[#123b37]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" /><circle cx="12" cy="11" r="2.25" /></svg></span><div><p className="text-sm font-semibold">{coordinates ? 'Location ready' : 'Use my device location'}</p><p className="mt-1 text-xs leading-5 text-[#75847f]">{coordinates ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : 'This is optional and can be changed later.'}</p></div></div><button type="button" onClick={requestLocation} disabled={isLocating} className="mt-4 w-full rounded-xl bg-[#10201e] py-3 text-xs font-bold text-white transition hover:bg-[#1c3631] disabled:opacity-60 dark:bg-[#e8c36a] dark:text-[#10201e]">{isLocating ? 'Requesting permission...' : coordinates ? 'Update location' : 'Allow location access'}</button></div><label className="mt-5 block text-xs font-semibold text-[#52615e] dark:text-[#b7c7c1]">Or enter a general area<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" className="mt-2 w-full rounded-xl border border-[#10201e]/15 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#087f6b] dark:border-white/10 dark:bg-white/5" /></label></div>}

                        {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
                        <div className="mt-8 flex items-center justify-between gap-3"><button type="button" onClick={() => step === 0 ? finish() : setStep((current) => current - 1)} className="text-xs font-semibold text-[#75847f] transition hover:text-[#10201e] dark:hover:text-white">{step === 0 ? 'Skip for now' : 'Back'}</button><button type="button" onClick={next} disabled={isSaving} className="rounded-xl bg-[#087f6b] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#087f6b]/20 transition hover:-translate-y-0.5 disabled:opacity-60">{isSaving ? 'Saving...' : step === 2 ? 'Save my preferences' : 'Continue'}</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

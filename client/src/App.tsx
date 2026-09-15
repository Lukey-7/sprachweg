import React, { useCallback, useEffect, useState } from 'react';
import { Card, WordEntry } from './types';
import { api, ApiError } from './services/api';
import { errorMessage, useAddCard, useHealth, useTodayCards, useUser } from './services/queries';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { DictionaryModal } from './components/DictionaryModal';
import { PlacementTestModal } from './components/PlacementTestModal';
import { ErrorPanel, OfflineBanner, Segmented, useToast } from './components/Feedback';
import { TodaySessionView } from './views/TodaySessionView';
import { SentenceMinerView } from './views/SentenceMinerView';
import { DictionaryView } from './views/DictionaryView';
import { GrammarCourseView } from './views/GrammarCourseView';
import { FSRSDuelView } from './views/FSRSDuelView';
import { VoiceStudioView } from './views/VoiceStudioView';
import { ImmersionProgressView, ReaderView } from './views/ImmersionProgressView';

type NewCard = Parameters<typeof api.addCard>[0];

const TAB_KEY = 'sprachweg.tab';
const readTab = (): TabId => {
  try {
    return (localStorage.getItem(TAB_KEY) as TabId) || 'today';
  } catch {
    return 'today';
  }
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(readTab);
  const [learnView, setLearnView] = useState<'grammar' | 'reader'>('grammar');
  const [exploreView, setExploreView] = useState<'dictionary' | 'miner'>('dictionary');
  const [lookup, setLookup] = useState<{ word: WordEntry; mock: boolean } | null>(null);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);

  const userQuery = useUser();
  const todayCards = useTodayCards();
  const health = useHealth();
  const addCard = useAddCard();
  const toast = useToast();

  const aiIsMock = health.data?.ai === 'mock';

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, activeTab);
    } catch {
      /* storage unavailable: tab just isn't remembered */
    }
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const openWordLookup = useCallback(
    async (lemma: string) => {
      const clean = lemma.replace(/[.,!?;:"„“«»()]/g, '').trim();
      if (!clean) return;
      try {
        const result = await api.lookupWord(clean);
        if (result) setLookup({ word: result.data, mock: result.mock });
        else toast('error', `"${clean}" isn't in the dictionary yet.`);
      } catch (e) {
        toast('error', errorMessage(e));
      }
    },
    [toast]
  );

  const saveCard = useCallback(
    async (card: NewCard): Promise<Card | null> => {
      try {
        const created = await addCard.mutateAsync(card);
        toast('success', `Added "${card.prompt}" to your review deck.`);
        return created;
      } catch (e) {
        const duplicate = e instanceof ApiError && /already exists/i.test(e.message);
        toast('error', duplicate ? `"${card.prompt}" is already in your deck.` : errorMessage(e));
        return null;
      }
    },
    [addCard, toast]
  );

  const saveWord = useCallback(
    (w: WordEntry) =>
      saveCard({
        cardType: 'recognition',
        prompt: `${w.gender ? `${w.gender} ` : ''}${w.lemma}`,
        answer: w.meaningEn,
        contextSentence: w.examples?.[0]?.de,
        wordId: w.id?.startsWith('word-') ? undefined : w.id,
      }),
    [saveCard]
  );

  if (userQuery.isPending) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full">
          <ErrorPanel title="Sprachweg can't reach its server" error={userQuery.error} onRetry={() => userQuery.refetch()} />
        </div>
      </div>
    );
  }

  const user = userQuery.data;
  const dueCount = todayCards.data?.cards.length ?? 0;

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <Header user={user} onOpenProgress={() => setActiveTab('progress')} />
      <OfflineBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4">
        {activeTab === 'today' && (
          <TodaySessionView user={user} dueCount={dueCount} onNavigate={setActiveTab} onOpenLearn={setLearnView} onOpenExplore={setExploreView} />
        )}

        {activeTab === 'review' && <FSRSDuelView onOpenWordLookup={openWordLookup} onFinished={() => setActiveTab('today')} />}

        {activeTab === 'learn' && (
          <>
            <Segmented
              value={learnView}
              onChange={setLearnView}
              options={[
                { id: 'grammar', label: 'Grammar' },
                { id: 'reader', label: 'Reader' },
              ]}
            />
            {learnView === 'grammar' ? <GrammarCourseView user={user} /> : <ReaderView onOpenWordLookup={openWordLookup} />}
          </>
        )}

        {activeTab === 'explore' && (
          <>
            <Segmented
              value={exploreView}
              onChange={setExploreView}
              options={[
                { id: 'dictionary', label: 'Dictionary' },
                { id: 'miner', label: 'Sentence Miner' },
              ]}
            />
            {exploreView === 'dictionary' ? (
              <DictionaryView onAddCard={saveWord} aiIsMock={aiIsMock} />
            ) : (
              <SentenceMinerView user={user} onOpenWordLookup={openWordLookup} onAddCard={saveCard} />
            )}
          </>
        )}

        {activeTab === 'speak' && <VoiceStudioView onAddCard={saveCard} />}

        {activeTab === 'progress' && <ImmersionProgressView user={user} onOpenPlacement={() => setIsPlacementOpen(true)} />}
      </main>

      <DictionaryModal word={lookup?.word ?? null} isMock={lookup?.mock ?? false} onClose={() => setLookup(null)} onAddCard={saveWord} />

      <PlacementTestModal isOpen={isPlacementOpen} onClose={() => setIsPlacementOpen(false)} />

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} dueCardCount={dueCount} />
    </div>
  );
};

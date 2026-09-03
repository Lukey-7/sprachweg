import React, { useState, useEffect } from 'react';
import { Card, GrammarTopic, GradedStory, User, WordEntry } from './types';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { DictionaryModal } from './components/DictionaryModal';
import { PlacementTestModal } from './components/PlacementTestModal';
import { TodaySessionView } from './views/TodaySessionView';
import { SentenceMinerView } from './views/SentenceMinerView';
import { DictionaryView } from './views/DictionaryView';
import { GrammarCourseView } from './views/GrammarCourseView';
import { FSRSDuelView } from './views/FSRSDuelView';
import { VoiceStudioView } from './views/VoiceStudioView';
import { ImmersionProgressView } from './views/ImmersionProgressView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [stories, setStories] = useState<GradedStory[]>([]);
  const [lookupWord, setLookupWord] = useState<WordEntry | null>(null);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [dictionaryQuery, setDictionaryQuery] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const u = await ApiService.getUser();
      setUser(u);
      const c = await ApiService.getDueCards();
      setCards(c);
      const t = await ApiService.getCurriculumTopics();
      setTopics(t);
      const s = await ApiService.getGradedStories();
      setStories(s);
    };
    init();
  }, []);

  const handleOpenWordLookup = async (lemma: string) => {
    const wordEntry = await ApiService.lookupWord(lemma);
    if (wordEntry) {
      setLookupWord(wordEntry);
    }
  };

  const handleAddCard = async (wordOrCardData: any) => {
    if (wordOrCardData.lemma) {
      // WordEntry
      const w = wordOrCardData as WordEntry;
      const newCard = await ApiService.addCardToDeck({
        cardType: 'recognition',
        prompt: `${w.gender ? w.gender + ' ' : ''}${w.lemma}`,
        answer: w.meaningEn,
        contextSentence: w.examples?.[0]?.de,
      });
      setCards(prev => [...prev, newCard]);
    } else {
      // Raw card payload
      const newCard = await ApiService.addCardToDeck(wordOrCardData);
      setCards(prev => [...prev, newCard]);
    }
  };

  const handleReviewCard = async (cardId: string, rating: 1 | 2 | 3 | 4) => {
    await ApiService.submitReview(cardId, rating);
  };

  const handleUpdateLevel = (newLevel: any) => {
    if (user) {
      setUser({ ...user, activeLevel: newLevel });
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading Sprachweg Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Sticky Header */}
      <Header user={user} onOpenPlacement={() => setIsPlacementOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-24">
        {activeTab === 'today' && (
          <TodaySessionView
            user={user}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenWordLookup={handleOpenWordLookup}
            topics={topics}
          />
        )}

        {activeTab === 'miner' && (
          <SentenceMinerView
            onOpenWordLookup={handleOpenWordLookup}
            onAddCard={handleAddCard}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView
            initialQuery={dictionaryQuery}
            onAddCard={handleAddCard}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarCourseView
            topics={topics}
            onOpenWordLookup={handleOpenWordLookup}
          />
        )}

        {activeTab === 'srs' && (
          <FSRSDuelView
            cards={cards}
            onReviewCard={handleReviewCard}
            onOpenWordLookup={handleOpenWordLookup}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceStudioView onAddCard={handleAddCard} />
        )}

        {activeTab === 'progress' && (
          <ImmersionProgressView
            user={user}
            stories={stories}
            onOpenWordLookup={handleOpenWordLookup}
            onOpenPlacement={() => setIsPlacementOpen(true)}
          />
        )}
      </main>

      {/* Universal Floating Word Lookup Modal */}
      <DictionaryModal
        word={lookupWord}
        onClose={() => setLookupWord(null)}
        onAddCard={handleAddCard}
      />

      {/* Monthly Placement Diagnostic Modal */}
      <PlacementTestModal
        isOpen={isPlacementOpen}
        onClose={() => setIsPlacementOpen(false)}
        onUpdateLevel={handleUpdateLevel}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        dueCardCount={cards.filter(c => c.state === 'new' || new Date(c.dueAt) <= new Date()).length}
      />
    </div>
  );
};

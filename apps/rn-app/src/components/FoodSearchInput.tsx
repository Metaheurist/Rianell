import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { searchFood, getFodmapStatus, getFodmapWarning, calculateMacrosForServing } from '@rianell/shared';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

type FoodResult = Awaited<ReturnType<typeof searchFood>>[number];

type Props = {
  onSelect: (label: string, item?: FoodResult) => void;
};

export function FoodSearchInput({ onSelect }: Props) {
  const t = useT();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const items = await searchFood(trimmed);
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void runSearch(query), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, runSearch]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 4 }}>
        {t('wizard.food.search')}
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('wizard.food.searchPlaceholder')}
        placeholderTextColor="rgba(255,255,255,0.5)"
        style={{
          borderWidth: 1,
          borderColor: theme.tokens.color.border,
          borderRadius: 8,
          padding: 10,
          color: theme.tokens.color.text,
          fontSize: theme.font(14),
        }}
        accessibilityLabel={t('wizard.food.search')}
      />
      {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
      {!loading && query.trim().length >= 2 && results.length === 0 ? (
        <Text style={{ color: theme.tokens.color.textMuted, marginTop: 6, fontSize: theme.font(12) }}>
          {t('wizard.food.noResults')}
        </Text>
      ) : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.barcode || item.name}
        scrollEnabled={results.length > 0}
        style={{ maxHeight: 180, marginTop: 6 }}
        renderItem={({ item }) => {
          const fodmap = getFodmapStatus(item.name);
          const fodmapKey = getFodmapWarning(fodmap);
          const label = [item.brand, item.name].filter(Boolean).join(', ');
          return (
            <Pressable
              onPress={() => {
                const macros = calculateMacrosForServing(item, 100);
                onSelect(label, { ...item, macros } as FoodResult & { macros: ReturnType<typeof calculateMacrosForServing> });
                setQuery('');
                setResults([]);
              }}
              style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.tokens.color.border }}
            >
              <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>{label}</Text>
              {fodmapKey ? (
                <Text style={{ color: theme.tokens.color.accent, fontSize: theme.font(11) }}>{t(fodmapKey)}</Text>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

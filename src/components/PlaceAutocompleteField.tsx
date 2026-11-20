import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchPlaces, type GeocodingResult } from "@/services/geocoding";

type Props = {
  label: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: GeocodingResult) => void;
  editable?: boolean;
  active?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Initial value (uncontrolled) */
  defaultValue?: string;
  /** Ciudad usada para restringir la geocodificación. */
  cityId?: string;
};

export const PlaceAutocompleteField = forwardRef<TextInput, Props>(
  function PlaceAutocompleteField(
    {
      label,
      placeholder,
      onChangeText,
      onSelectPlace,
      editable = true,
      active = false,
      onFocus,
      onBlur,
      defaultValue = "",
      cityId,
    },
    ref,
  ) {
    const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);
    const valueRef = useRef(defaultValue);

    // Forward ref
    useEffect(() => {
      if (typeof ref === "function") {
        ref(inputRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<TextInput | null>).current = inputRef.current;
      }
    }, [ref]);

    const handleChangeText = useCallback(
      (text: string) => {
        valueRef.current = text;
        onChangeText(text);

        if (!active || !editable) return;
        const q = text.trim();
        if (q.length < 2) {
          setSuggestions([]);
          setError(null);
          return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          setLoading(true);
          setError(null);
          try {
            const results = await searchPlaces(q, { cityId });
            setSuggestions(results);
            if (results.length === 0) setError("Sin resultados en Montevideo");
          } catch {
            setSuggestions([]);
            setError("Backend no disponible");
          } finally {
            setLoading(false);
          }
        }, 320);
      },
      [active, editable, cityId, onChangeText],
    );

    useEffect(() => {
      if (!active || !editable) {
        setSuggestions([]);
      }
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [active, editable]);

    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={inputRef}
          defaultValue={defaultValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A929B"
          style={styles.input}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {active && editable && valueRef.current.trim().length >= 2 ? (
          <View style={styles.dropdown}>
            {loading ? <ActivityIndicator color="#167D72" style={styles.loader} /> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {!loading && suggestions.length > 0 ? (
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.list}>
                {suggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.item}
                    onPress={() => {
                      onSelectPlace(item);
                      setSuggestions([]);
                    }}
                  >
                    <Text style={styles.itemText} numberOfLines={2}>
                      {item.displayName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { flex: 1, zIndex: 1 },
  label: { color: "#8A929B", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  input: { color: "#17212B", fontSize: 14, paddingVertical: 4, marginTop: 1 },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: -4,
    right: -4,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8EC",
    maxHeight: 180,
    zIndex: 20,
    elevation: 8,
    shadowColor: "#17212B",
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  loader: { padding: 12 },
  errorText: { color: "#8A4A1B", fontSize: 11, padding: 10 },
  list: { maxHeight: 168 },
  item: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F0F2F4" },
  itemText: { color: "#17212B", fontSize: 13, lineHeight: 17 },
});
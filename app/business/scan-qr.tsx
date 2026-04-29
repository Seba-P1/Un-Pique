import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { QrCode, CheckCircle2, XCircle, Search } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ScanQRScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'used';
    message: string;
    description?: string;
  } | null>(null);

  const handleValidate = async () => {
    if (!code.trim() || !user) return;
    
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('point_redemptions')
        .select('*')
        .eq('qr_code', code.trim().toUpperCase())
        .single();

      if (error || !data) {
        setResult({ type: 'error', message: 'Código inválido o no encontrado.' });
        return;
      }

      if (data.status === 'used') {
        setResult({ type: 'used', message: 'Este código ya fue usado.', description: data.description });
        return;
      }

      const isExpired = new Date(data.qr_expires_at) < new Date();
      if (isExpired || data.status !== 'pending') {
        setResult({ type: 'error', message: 'El código se encuentra vencido o cancelado.' });
        return;
      }

      // Valid and pending, mark as used
      const { error: updateError } = await supabase
        .from('point_redemptions')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', data.id);

      if (updateError) {
        throw updateError;
      }

      setResult({ 
        type: 'success', 
        message: '¡Canje válido!', 
        description: data.description 
      });
      setCode('');

    } catch (err) {
      console.error(err);
      setResult({ type: 'error', message: 'Ocurrió un error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: tc.bg }]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <QrCode size={48} color={tc.text} />
        </View>
        <Text style={[styles.title, { color: tc.text }]}>Validar Canje</Text>
        <Text style={[styles.subtitle, { color: tc.textMuted }]}>
          Ingresá el código alfanumérico que te muestra el cliente en su pantalla.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
            placeholder="Ej: A1B2-TIMESTAMP"
            placeholderTextColor={tc.textMuted}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              if (result) setResult(null); // Clear result on new typing
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <Pressable 
          style={[
            styles.validateBtn, 
            (!code.trim() || loading) && { opacity: 0.6 }
          ]} 
          onPress={handleValidate}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Search size={20} color="#FFF" />
              <Text style={styles.validateBtnText}>Validar Código</Text>
            </>
          )}
        </Pressable>

        {/* RESULTS AREA */}
        {result && (
          <View style={[
            styles.resultCard,
            result.type === 'success' ? styles.resultSuccess : 
            result.type === 'error' ? styles.resultError : styles.resultUsed
          ]}>
            <View style={styles.resultHeader}>
              {result.type === 'success' ? <CheckCircle2 size={24} color="#059669" /> : 
               result.type === 'error' ? <XCircle size={24} color="#DC2626" /> :
               <XCircle size={24} color="#D97706" />}
              <Text style={[
                styles.resultTitle,
                result.type === 'success' ? { color: '#059669' } : 
                result.type === 'error' ? { color: '#DC2626' } : { color: '#D97706' }
              ]}>
                {result.message}
              </Text>
            </View>
            
            {result.description && (
              <View style={styles.resultDescBox}>
                <Text style={styles.resultDescLabel}>Premio a entregar:</Text>
                <Text style={styles.resultDescText}>{result.description}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 24,
    fontFamily: 'NunitoSans-Black',
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  validateBtn: {
    width: '100%',
    backgroundColor: '#FF6B35',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  validateBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
  resultCard: {
    width: '100%',
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resultUsed: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
  },
  resultDescBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  resultDescLabel: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultDescText: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 16,
    color: '#111827',
  },
});

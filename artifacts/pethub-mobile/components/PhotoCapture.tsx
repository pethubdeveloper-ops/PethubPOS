import React, { useState } from 'react';
import {
  View, Text, Image, Pressable, Alert, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { API_BASE } from '@/constants/apiConfig';

interface Props {
  label: string;
  /** Stored objectPath (/objects/uuid) or null when no photo yet. */
  photo: string | null;
  onChange: (objectPath: string | null) => void;
}

/** Convert stored objectPath → displayable absolute URI. */
export function photoUri(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  // Build storage serving URL from the API base (strip /pethub suffix for the path prefix)
  const storageBase = API_BASE; // API_BASE already includes /api/pethub
  return `${storageBase}/storage/photo?path=${encodeURIComponent(path)}`;
}

async function uploadToStorage(localUri: string): Promise<string> {
  // POST the file directly to our server — avoids any CORS issues with GCS
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  const resp = await fetch(`${API_BASE}/storage/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  const { objectPath } = await resp.json();
  return objectPath as string;
}

export function PhotoCapture({ label, photo, onChange }: Props) {
  const colors = useColors();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePicked = async (localUri: string) => {
    setLocalPreview(localUri);
    setUploading(true);
    try {
      const objectPath = await uploadToStorage(localUri);
      setLocalPreview(null);
      onChange(objectPath);
    } catch {
      setLocalPreview(null);
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take proof photos.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) handlePicked(result.assets[0].uri);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) handlePicked(result.assets[0].uri);
  };

  const handleCapture = () => {
    if (Platform.OS === 'web') {
      openGallery();
    } else {
      Alert.alert(label, 'Choose photo source', [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Determine display URI: local preview during upload, or stored photo URL
  const displayUri = localPreview ?? photoUri(photo);

  if (displayUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: displayUri }} style={styles.preview} resizeMode="cover" />
        {uploading ? (
          <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.overlayText}>Uploading…</Text>
          </View>
        ) : (
          <>
            <View style={[styles.overlay, { backgroundColor: colors.primary + 'cc' }]}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.overlayText}>Photo captured</Text>
            </View>
            <Pressable
              onPress={() => { onChange(null); setLocalPreview(null); }}
              style={[styles.retakeBtn, { backgroundColor: colors.card }]}
            >
              <Feather name="refresh-ccw" size={14} color={colors.foreground} />
              <Text style={[styles.retakeText, { color: colors.foreground }]}>Retake</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={uploading ? undefined : handleCapture}
      style={({ pressed }) => [
        styles.captureBtn,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.muted : colors.card,
          opacity: uploading ? 0.5 : 1,
        },
      ]}
    >
      <Feather name="camera" size={24} color={colors.accent} />
      <Text style={[styles.captureBtnTitle, { color: colors.accent }]}>{label}</Text>
      <Text style={[styles.captureBtnSub, { color: colors.mutedForeground }]}>
        Tap to open camera
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    height: 150,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  retakeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  captureBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  captureBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  captureBtnSub: {
    fontSize: 12,
  },
});

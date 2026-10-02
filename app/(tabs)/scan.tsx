import {
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import {
  parseQRPayload,
} from '@/lib/qr';

import {
  registerAttendance,
} from '@/lib/attendance';

export default function ScanScreen() {
  const [
    permission,
    requestPermission,
  ] =
    useCameraPermissions();

  const [
    scanned,
    setScanned,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    messageType,
    setMessageType,
  ] = useState<
    'success' | 'error' | ''
  >('');

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setProcessing(false);
      setMessage('');
      setMessageType('');
    }, [])
  );

  async function handleBarcodeScanned({
    data,
  }: {
    data: string;
  }) {
    if (
      scanned ||
      processing
    ) {
      return;
    }

    setScanned(true);
    setProcessing(true);
    setMessage('');

    const payload =
      parseQRPayload(data);

    if (!payload) {
      setMessage(
        'Invalid QR code.'
      );
      setMessageType('error');
      setProcessing(false);
      return;
    }

    const {
      error,
    } =
      await registerAttendance(
        payload.event
      );

    setProcessing(false);

    if (error) {
      setMessage(
        error.message
      );
      setMessageType('error');
      return;
    }

    setMessage(
      'Attendance recorded successfully!'
    );

    setMessageType('success');
  }

  async function requestCamera() {
    await requestPermission();
  }

  if (!permission) {
    return (
      <View
        style={styles.center}
      >
        <Text>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={styles.center}
      >
        <Text
          style={styles.permissionTitle}
        >
          Camera Permission Required
        </Text>

        <Text
          style={styles.permissionText}
        >
          QR-ATT needs access to
          your camera to scan event
          QR codes.
        </Text>

        <Text
          style={styles.permissionButton}
          onPress={
            requestCamera
          }
        >
          ALLOW CAMERA
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
          ],
        }}
        onBarcodeScanned={
          scanned
            ? undefined
            : handleBarcodeScanned
        }
      />

      <View
        style={styles.overlay}
      >
        <Text
          style={styles.title}
        >
          Scan Event QR
        </Text>

        <Text
          style={styles.subtitle}
        >
          Place the QR code inside
          the square
        </Text>

        <View
          style={styles.scannerBox}
        />

        {processing ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={styles.messageText}
            >
              Checking attendance...
            </Text>
          </View>
        ) : null}

        {message ? (
          <View
            style={[
              styles.messageBox,
              messageType ===
                'success'
                ? styles.successBox
                : styles.errorBox,
            ]}
          >
            <Text
              style={styles.messageText}
            >
              {message}
            </Text>
          </View>
        ) : null}

        {scanned ? (
          <Text
            style={styles.scanAgain}
            onPress={() => {
              setScanned(false);
              setMessage('');
              setMessageType('');
            }}
          >
            SCAN AGAIN
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 25,
      backgroundColor: '#f5f7fb',
    },

    permissionTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 10,
      color: '#111827',
      textAlign: 'center',
    },

    permissionText: {
      color: '#64748b',
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 20,
    },

    permissionButton: {
      backgroundColor: '#2563eb',
      color: '#fff',
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 10,
      overflow: 'hidden',
      fontWeight: '800',
    },

    overlay: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 75,
      backgroundColor:
        'rgba(0,0,0,0.35)',
    },

    title: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
    },

    subtitle: {
      color: '#e5e7eb',
      marginTop: 7,
      marginBottom: 35,
    },

    scannerBox: {
      width: 270,
      height: 270,
      borderWidth: 3,
      borderColor: '#fff',
      borderRadius: 20,
      backgroundColor:
        'transparent',
    },

    messageBox: {
      marginTop: 25,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        'rgba(15,23,42,0.9)',
      maxWidth: '88%',
    },

    successBox: {
      backgroundColor:
        'rgba(22,101,52,0.95)',
    },

    errorBox: {
      backgroundColor:
        'rgba(153,27,27,0.95)',
    },

    messageText: {
      color: '#fff',
      fontWeight: '700',
      textAlign: 'center',
    },

    scanAgain: {
      marginTop: 18,
      color: '#fff',
      fontWeight: '800',
      backgroundColor: '#2563eb',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      overflow: 'hidden',
    },
  });
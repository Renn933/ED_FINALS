import {
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getMyAttendance,
  type Attendance,
} from '@/lib/attendance';

export default function HistoryScreen() {
  const [
    records,
    setRecords,
  ] = useState<Attendance[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  async function loadHistory() {
    setLoading(true);

    const {
      data,
      error,
    } =
      await getMyAttendance();

    if (error) {
      console.log(
        error.message
      );
    }

    setRecords(
      data ?? []
    );

    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);

    await loadHistory();

    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Attendance History
        </Text>

        <Text
          style={styles.subtitle}
        >
          Your recorded school event
          attendance
        </Text>
      </View>

      <View
        style={styles.content}
      >
        {records.length === 0 ? (
          <View
            style={styles.empty}
          >
            <Text
              style={styles.emptyIcon}
            >
              📋
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No Attendance Records
            </Text>

            <Text
              style={styles.emptyText}
            >
              Your attendance will
              appear here after you
              scan an event QR code.
            </Text>
          </View>
        ) : (
          records.map(
            (record) => (
              <View
                key={record.id}
                style={styles.card}
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.eventInfo
                    }
                  >
                    <Text
                      style={
                        styles.eventTitle
                      }
                    >
                      {record.event
                        ?.title ??
                        'Event'}
                    </Text>

                    <Text
                      style={
                        styles.eventCode
                      }
                    >
                      {record.event
                        ?.event_code ??
                        ''}
                    </Text>
                  </View>

                  <View
                    style={styles.status}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.detail}
                >
                  📍{' '}
                  {record.event
                    ?.venue ??
                    'No venue'}
                </Text>

                <Text
                  style={styles.detail}
                >
                  📅{' '}
                  {new Date(
                    record.scanned_at
                  ).toLocaleDateString()}
                </Text>

                <Text
                  style={styles.detail}
                >
                  🕒{' '}
                  {new Date(
                    record.scanned_at
                  ).toLocaleTimeString()}
                </Text>
              </View>
            )
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f7fb',
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    header: {
      backgroundColor: '#2563eb',
      paddingTop: 55,
      paddingHorizontal: 22,
      paddingBottom: 25,
    },

    title: {
      color: '#fff',
      fontSize: 27,
      fontWeight: '800',
    },

    subtitle: {
      color: '#dbeafe',
      marginTop: 5,
    },

    content: {
      padding: 20,
    },

    empty: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      marginTop: 10,
    },

    emptyIcon: {
      fontSize: 40,
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#111827',
    },

    emptyText: {
      color: '#64748b',
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 8,
    },

    card: {
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 17,
      marginBottom: 13,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },

    eventInfo: {
      flex: 1,
    },

    eventTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#111827',
    },

    eventCode: {
      color: '#64748b',
      fontSize: 12,
      marginTop: 4,
    },

    status: {
      backgroundColor: '#dcfce7',
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    statusText: {
      color: '#166534',
      fontWeight: '800',
      fontSize: 10,
    },

    detail: {
      color: '#475569',
      marginTop: 7,
      fontSize: 13,
    },
  });
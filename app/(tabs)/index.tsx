import { useFocusEffect, router } from 'expo-router';

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
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';

export default function Index() {
  const [
    studentName,
    setStudentName,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  // ============================================
  // LOAD STUDENT PROFILE
  // ============================================

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        setStudentName('Student');
        return;
      }

      const {
        data,
        error,
      } = await getProfile(user.id);

      if (error) {
        console.log(
          'HOME PROFILE ERROR:',
          error.message
        );

        setStudentName('Student');
        return;
      }

      if (data) {
        setStudentName(
          data.full_name ||
          'Student'
        );
      } else {
        setStudentName('Student');
      }

    } catch (error: any) {
      console.log(
        'HOME PROFILE EXCEPTION:',
        error?.message
      );

      setStudentName('Student');

    } finally {
      setLoading(false);
    }
  }


  // ============================================
  // REFRESH
  // ============================================

  async function refresh() {
    setRefreshing(true);

    await loadProfile();

    setRefreshing(false);
  }


  // ============================================
  // LOAD WHEN SCREEN OPENS
  // ============================================

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );


  // ============================================
  // LOADING
  // ============================================

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


  // ============================================
  // HOME SCREEN
  // ============================================

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

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <View
        style={styles.header}
      >

        <Text
          style={styles.welcome}
        >
          Welcome back!
        </Text>

        <Text
          style={styles.studentName}
        >
          {studentName}
        </Text>

        <Text
          style={styles.subtitle}
        >
          School Event Attendance
        </Text>

      </View>


      {/* ====================================== */}
      {/* CONTENT */}
      {/* ====================================== */}

      <View
        style={styles.content}
      >

        {/* QUICK ACTIONS */}

        <Text
          style={styles.sectionTitle}
        >
          Quick Actions
        </Text>


        {/* SCAN QR */}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            router.push('/scan')
          }
          activeOpacity={0.8}
        >

          <View
            style={styles.iconBox}
          >
            <Text
              style={styles.icon}
            >
              📷
            </Text>
          </View>

          <View
            style={styles.actionInfo}
          >

            <Text
              style={styles.actionTitle}
            >
              Scan QR Code
            </Text>

            <Text
              style={styles.actionText}
            >
              Scan an event QR code to
              record your attendance.
            </Text>

          </View>

          <Text
            style={styles.arrow}
          >
            ›
          </Text>

        </TouchableOpacity>


        {/* ATTENDANCE HISTORY */}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            router.push('/history')
          }
          activeOpacity={0.8}
        >

          <View
            style={styles.iconBox}
          >
            <Text
              style={styles.icon}
            >
              📋
            </Text>
          </View>

          <View
            style={styles.actionInfo}
          >

            <Text
              style={styles.actionTitle}
            >
              Attendance History
            </Text>

            <Text
              style={styles.actionText}
            >
              View your recorded school
              event attendance.
            </Text>

          </View>

          <Text
            style={styles.arrow}
          >
            ›
          </Text>

        </TouchableOpacity>


        {/* PROFILE */}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            router.push('/profile')
          }
          activeOpacity={0.8}
        >

          <View
            style={styles.iconBox}
          >
            <Text
              style={styles.icon}
            >
              👤
            </Text>
          </View>

          <View
            style={styles.actionInfo}
          >

            <Text
              style={styles.actionTitle}
            >
              My Profile
            </Text>

            <Text
              style={styles.actionText}
            >
              View your account information.
            </Text>

          </View>

          <Text
            style={styles.arrow}
          >
            ›
          </Text>

        </TouchableOpacity>


        {/* INFORMATION CARD */}

        <View
          style={styles.infoCard}
        >

          <Text
            style={styles.infoIcon}
          >
            📱
          </Text>

          <View
            style={styles.infoContent}
          >

            <Text
              style={styles.infoTitle}
            >
              QR Attendance
            </Text>

            <Text
              style={styles.infoText}
            >
              Scan the QR code provided by
              your teacher during school
              events to record your
              attendance.
            </Text>

          </View>

        </View>

      </View>

    </ScrollView>
  );
}


// ============================================
// STYLES
// ============================================

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
      backgroundColor: '#f5f7fb',
    },


    // ========================================
    // HEADER
    // ========================================

    header: {
      backgroundColor: '#2563eb',
      paddingTop: 55,
      paddingHorizontal: 22,
      paddingBottom: 28,
    },


    welcome: {
      color: '#dbeafe',
      fontSize: 15,
      marginBottom: 3,
    },


    studentName: {
      color: '#fff',
      fontSize: 27,
      fontWeight: '800',
    },


    subtitle: {
      color: '#dbeafe',
      marginTop: 7,
      fontSize: 14,
    },


    // ========================================
    // CONTENT
    // ========================================

    content: {
      padding: 20,
    },


    sectionTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 12,
    },


    // ========================================
    // ACTION CARD
    // ========================================

    actionCard: {
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 17,
      marginBottom: 13,
      flexDirection: 'row',
      alignItems: 'center',

      elevation: 2,

      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,

      shadowOffset: {
        width: 0,
        height: 2,
      },
    },


    iconBox: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: '#eff6ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },


    icon: {
      fontSize: 25,
    },


    actionInfo: {
      flex: 1,
    },


    actionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#111827',
    },


    actionText: {
      color: '#64748b',
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },


    arrow: {
      fontSize: 30,
      color: '#94a3b8',
      marginLeft: 8,
    },


    // ========================================
    // INFORMATION CARD
    // ========================================

    infoCard: {
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 18,
      marginTop: 7,
      flexDirection: 'row',

      elevation: 2,

      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,

      shadowOffset: {
        width: 0,
        height: 2,
      },
    },


    infoIcon: {
      fontSize: 28,
      marginRight: 14,
    },


    infoContent: {
      flex: 1,
    },


    infoTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 5,
    },


    infoText: {
      color: '#64748b',
      fontSize: 13,
      lineHeight: 19,
    },

  });
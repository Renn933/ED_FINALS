import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';

type Role = 'student' | 'teacher' | 'admin';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

type Event = {
  id: string;
  event_code: string;
  title: string;
  venue: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_by: string;
};

type Attendance = {
  id: string;
  student_id: string;
  event_id: string;
  status: string;
  scanned_at: string | null;
};

type AttendanceDisplay = Attendance & {
  student_name: string;
  student_email: string;
  event_title: string;
};

export default function AdminScreen() {
  const router = useRouter();

  const [role, setRole] =
    useState<Role | null>(null);

  const [users, setUsers] =
    useState<Profile[]>([]);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceDisplay[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
  ==========================================
  LOAD ADMIN DASHBOARD
  ==========================================
  */

  const loadDashboard = useCallback(
    async () => {
      try {
        setError(null);

        const {
          data: authData,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        const user = authData.user;

        if (!user) {
          router.replace('/login');
          return;
        }

        /*
        --------------------------------------
        GET PROFILE
        --------------------------------------
        */

        const profileResult =
          await getProfile(user.id);

        if (profileResult.error) {
          console.error(
            'Profile error:',
            profileResult.error
          );

          throw profileResult.error;
        }

        const profile =
          profileResult.data;

        if (!profile) {
          throw new Error(
            'Administrator profile was not found.'
          );
        }

        const currentRole =
          profile.role as Role;

        setRole(currentRole);

        /*
        --------------------------------------
        ADMIN CHECK
        --------------------------------------
        */

        if (currentRole !== 'admin') {
          Alert.alert(
            'Unauthorized',
            'Only administrators can access this page.'
          );

          router.replace('/(tabs)');
          return;
        }

        /*
        ======================================
        USERS
        ======================================
        */

        const {
          data: userData,
          error: userError,
        } = await supabase
          .from('profiles')
          .select(
            'id,email,full_name,role'
          )
          .order(
            'full_name',
            {
              ascending: true,
            }
          );

        if (userError) {
          throw userError;
        }

        setUsers(
          (userData ?? []) as Profile[]
        );

        /*
        ======================================
        EVENTS
        ======================================
        */

        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from('events')
          .select(
            'id,event_code,title,venue,description,start_time,end_time,status,created_by'
          )
          .order(
            'start_time',
            {
              ascending: false,
            }
          );

        if (eventError) {
          throw eventError;
        }

        setEvents(
          (eventData ?? []) as Event[]
        );

        /*
        ======================================
        ATTENDANCE
        ======================================

        IMPORTANT:
        Do NOT use created_at.

        Your attendance table uses scanned_at.
        ======================================
        */

        const {
          data: attendanceData,
          error: attendanceError,
        } = await supabase
          .from('attendance')
          .select(
            'id,student_id,event_id,status,scanned_at'
          )
          .order(
            'scanned_at',
            {
              ascending: false,
            }
          );

        if (attendanceError) {
          throw attendanceError;
        }

        /*
        ======================================
        CREATE USER MAP
        ======================================
        */

        const userMap =
          new Map<string, Profile>();

        (userData ?? []).forEach(
          (item: any) => {
            userMap.set(
              item.id,
              item as Profile
            );
          }
        );

        /*
        ======================================
        CREATE EVENT MAP
        ======================================
        */

        const eventMap =
          new Map<string, Event>();

        (eventData ?? []).forEach(
          (item: any) => {
            eventMap.set(
              item.id,
              item as Event
            );
          }
        );

        /*
        ======================================
        PREPARE ATTENDANCE
        ======================================
        */

        const displayAttendance:
          AttendanceDisplay[] =
          (attendanceData ?? []).map(
            (item: any) => {
              const student =
                userMap.get(
                  item.student_id
                );

              const event =
                eventMap.get(
                  item.event_id
                );

              return {
                id: item.id,
                student_id:
                  item.student_id,
                event_id:
                  item.event_id,
                status:
                  item.status,
                scanned_at:
                  item.scanned_at ?? null,

                student_name:
                  student?.full_name ??
                  'Unknown Student',

                student_email:
                  student?.email ??
                  'Unknown Email',

                event_title:
                  event?.title ??
                  'Unknown Event',
              };
            }
          );

        setAttendance(
          displayAttendance
        );

      } catch (err: any) {
        console.error(
          'Admin dashboard error:',
          err
        );

        setError(
          err?.message ??
            'Unable to load administrator dashboard.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  /*
  ==========================================
  INITIAL LOAD
  ==========================================
  */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  ==========================================
  REFRESH
  ==========================================
  */

  const onRefresh =
    async () => {
      setRefreshing(true);
      await loadDashboard();
    };

  /*
  ==========================================
  LOGOUT
  ==========================================
  */

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(true);

        console.log(
          'Administrator logout started...'
        );

        const {
          error,
        } =
          await supabase.auth.signOut();

        if (error) {
          console.error(
            'Supabase logout error:',
            error
          );

          setLoggingOut(false);

          Alert.alert(
            'Logout Error',
            error.message
          );

          return;
        }

        console.log(
          'Administrator logout successful.'
        );

        /*
        --------------------------------------
        GO TO LOGIN
        --------------------------------------
        */

        router.replace('/login');

      } catch (err: any) {
        console.error(
          'Logout failed:',
          err
        );

        setLoggingOut(false);

        Alert.alert(
          'Logout Error',
          err?.message ??
            'Unable to logout.'
        );
      }
    };

  /*
  ==========================================
  CLOSE EVENT
  ==========================================
  */

  const closeEvent =
    async (event: Event) => {
      Alert.alert(
        'Close Event',
        `Close "${event.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Close Event',
            style: 'destructive',

            onPress: async () => {
              try {
                const {
                  error,
                } =
                  await supabase
                    .from('events')
                    .update({
                      status: 'closed',
                    })
                    .eq(
                      'id',
                      event.id
                    );

                if (error) {
                  throw error;
                }

                Alert.alert(
                  'Success',
                  'Event has been closed.'
                );

                await loadDashboard();

              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.message ??
                    'Unable to close event.'
                );
              }
            },
          },
        ]
      );
    };

  /*
  ==========================================
  DELETE EVENT
  ==========================================
  */

  const deleteEvent =
    async (event: Event) => {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${event.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Delete',
            style: 'destructive',

            onPress: async () => {
              try {
                /*
                Delete attendance records first.
                */

                const {
                  error:
                    attendanceDeleteError,
                } =
                  await supabase
                    .from('attendance')
                    .delete()
                    .eq(
                      'event_id',
                      event.id
                    );

                if (
                  attendanceDeleteError
                ) {
                  throw attendanceDeleteError;
                }

                /*
                Delete event.
                */

                const {
                  error:
                    eventDeleteError,
                } =
                  await supabase
                    .from('events')
                    .delete()
                    .eq(
                      'id',
                      event.id
                    );

                if (eventDeleteError) {
                  throw eventDeleteError;
                }

                Alert.alert(
                  'Success',
                  'Event deleted successfully.'
                );

                await loadDashboard();

              } catch (err: any) {
                Alert.alert(
                  'Delete Error',
                  err?.message ??
                    'Unable to delete event.'
                );
              }
            },
          },
        ]
      );
    };

  /*
  ==========================================
  REMOVE ATTENDANCE
  ==========================================
  */

  const removeAttendance =
    async (
      record: AttendanceDisplay
    ) => {
      Alert.alert(
        'Remove Attendance',
        `Remove the attendance record of ${record.student_name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Remove',
            style: 'destructive',

            onPress: async () => {
              try {
                const {
                  error,
                } =
                  await supabase
                    .from('attendance')
                    .delete()
                    .eq(
                      'id',
                      record.id
                    );

                if (error) {
                  throw error;
                }

                Alert.alert(
                  'Success',
                  'Attendance record removed.'
                );

                await loadDashboard();

              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.message ??
                    'Unable to remove attendance record.'
                );
              }
            },
          },
        ]
      );
    };

  /*
  ==========================================
  CHANGE USER ROLE
  ==========================================
  */

  const changeUserRole =
    async (user: Profile) => {
      if (user.role === 'admin') {
        Alert.alert(
          'Administrator',
          'Administrator accounts cannot be changed from this screen.'
        );

        return;
      }

      Alert.alert(
        'Change Role',
        `Change ${
          user.full_name ??
          user.email
        }'s role?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Student',
            onPress: () =>
              updateUserRole(
                user,
                'student'
              ),
          },

          {
            text: 'Teacher',
            onPress: () =>
              updateUserRole(
                user,
                'teacher'
              ),
          },
        ]
      );
    };

  /*
  ==========================================
  UPDATE USER ROLE
  ==========================================
  */

  const updateUserRole =
    async (
      user: Profile,
      newRole: Role
    ) => {
      try {
        const {
          error,
        } =
          await supabase
            .from('profiles')
            .update({
              role: newRole,
            })
            .eq(
              'id',
              user.id
            );

        if (error) {
          throw error;
        }

        Alert.alert(
          'Success',
          `${
            user.full_name ??
            user.email
          } is now a ${newRole}.`
        );

        await loadDashboard();

      } catch (err: any) {
        Alert.alert(
          'Role Update Error',
          err?.message ??
            'Unable to update user role.'
        );
      }
    };

  /*
  ==========================================
  FORMAT DATE
  ==========================================
  */

  const formatDate =
    (
      value:
        string | null
    ) => {
      if (!value) {
        return 'Not available';
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return value;
      }

      return date.toLocaleString();
    };

  /*
  ==========================================
  LOADING SCREEN
  ==========================================
  */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading Administrator Dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  /*
  ==========================================
  ERROR SCREEN
  ==========================================
  */

  if (error) {
    return (
      <SafeAreaView
        style={
          styles.errorScreen
        }
      >
        <Ionicons
          name="alert-circle"
          size={55}
          color="#ef4444"
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to Load Dashboard
        </Text>

        <Text
          style={
            styles.errorMessage
          }
        >
          {error}
        </Text>

        <Pressable
          style={
            styles.primaryButton
          }
          onPress={
            loadDashboard
          }
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#ffffff"
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            TRY AGAIN
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.logoutButton
          }
          onPress={
            handleLogout
          }
        >
          {loggingOut ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#ffffff"
              />

              <Text
                style={
                  styles.logoutButtonText
                }
              >
                LOGOUT
              </Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    );
  }

  /*
  ==========================================
  ADMIN DASHBOARD
  ==========================================
  */

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
      >

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerTop
            }
          >
            <View>
              <Text
                style={
                  styles.headerTitle
                }
              >
                Administrator
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Manage users, events and attendance
              </Text>
            </View>

            <Pressable
              style={
                styles.headerLogout
              }
              onPress={
                handleLogout
              }
              disabled={
                loggingOut
              }
            >
              {loggingOut ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={23}
                  color="#ffffff"
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* ADMIN BADGE */}

        <View
          style={
            styles.adminBadge
          }
        >
          <Ionicons
            name="shield-checkmark"
            size={18}
            color="#2563eb"
          />

          <Text
            style={
              styles.adminBadgeText
            }
          >
            Administrator Access
          </Text>
        </View>

        {/* STATISTICS */}

        <View
          style={
            styles.statsContainer
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <View
              style={
                styles.statIcon
              }
            >
              <Ionicons
                name="people"
                size={25}
                color="#2563eb"
              />
            </View>

            <Text
              style={
                styles.statNumber
              }
            >
              {users.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Users
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <View
              style={
                styles.statIcon
              }
            >
              <Ionicons
                name="calendar"
                size={25}
                color="#2563eb"
              />
            </View>

            <Text
              style={
                styles.statNumber
              }
            >
              {events.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Events
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <View
              style={
                styles.statIcon
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={25}
                color="#2563eb"
              />
            </View>

            <Text
              style={
                styles.statNumber
              }
            >
              {attendance.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Attendance
            </Text>
          </View>
        </View>

        {/* USER MANAGEMENT */}

        <SectionTitle
          icon="people"
          title="User Management"
        />

        {users.length === 0 ? (
          <EmptyCard
            text="No users found."
          />
        ) : (
          users.map(
            (user) => (
              <View
                key={user.id}
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.avatar
                    }
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color="#2563eb"
                    />
                  </View>

                  <View
                    style={
                      styles.cardHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      {user.full_name ||
                        'No Name'}
                    </Text>

                    <Text
                      style={
                        styles.cardEmail
                      }
                    >
                      {user.email}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.infoRow
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Role:
                  </Text>

                  <View
                    style={[
                      styles.roleBadge,
                      user.role ===
                      'admin'
                        ? styles.adminRole
                        : user.role ===
                            'teacher'
                          ? styles.teacherRole
                          : styles.studentRole,
                    ]}
                  >
                    <Text
                      style={
                        styles.roleText
                      }
                    >
                      {user.role}
                    </Text>
                  </View>
                </View>

                {user.role !==
                  'admin' && (
                  <Pressable
                    style={
                      styles.blueButton
                    }
                    onPress={() =>
                      changeUserRole(
                        user
                      )
                    }
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={18}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      CHANGE ROLE
                    </Text>
                  </Pressable>
                )}
              </View>
            )
          )
        )}

        {/* EVENT MANAGEMENT */}

        <SectionTitle
          icon="calendar"
          title="Event Management"
        />

        {events.length === 0 ? (
          <EmptyCard
            text="No events found."
          />
        ) : (
          events.map(
            (event) => (
              <View
                key={event.id}
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.eventTop
                  }
                >
                  <View
                    style={
                      styles.eventTitleContainer
                    }
                  >
                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      {event.title}
                    </Text>

                    <Text
                      style={
                        styles.eventCode
                      }
                    >
                      {event.event_code}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      event.status ===
                      'closed'
                        ? styles.closedBadge
                        : styles.openBadge,
                    ]}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {event.status
                        ?.toUpperCase() ??
                        'OPEN'}
                    </Text>
                  </View>
                </View>

                {event.venue && (
                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#64748b"
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {event.venue}
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#64748b"
                  />

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    {formatDate(
                      event.start_time
                    )}
                  </Text>
                </View>

                {event.description && (
                  <Text
                    style={
                      styles.description
                    }
                  >
                    {event.description}
                  </Text>
                )}

                <View
                  style={
                    styles.buttonRow
                  }
                >
                  {event.status !==
                    'closed' && (
                    <Pressable
                      style={
                        styles.orangeButton
                      }
                      onPress={() =>
                        closeEvent(
                          event
                        )
                      }
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={17}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        CLOSE
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={
                      styles.redButton
                    }
                    onPress={() =>
                      deleteEvent(
                        event
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      DELETE
                    </Text>
                  </Pressable>
                </View>
              </View>
            )
          )
        )}

        {/* ATTENDANCE */}

        <SectionTitle
          icon="checkmark-circle"
          title="Attendance Records"
        />

        {attendance.length ===
        0 ? (
          <EmptyCard
            text="No attendance records found."
          />
        ) : (
          attendance.map(
            (record) => (
              <View
                key={record.id}
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.attendanceHeader
                  }
                >
                  <View
                    style={
                      styles.avatar
                    }
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color="#2563eb"
                    />
                  </View>

                  <View
                    style={
                      styles.cardHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      {
                        record.student_name
                      }
                    </Text>

                    <Text
                      style={
                        styles.cardEmail
                      }
                    >
                      {
                        record.student_email
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.attendanceDetails
                  }
                >
                  <Text
                    style={
                      styles.attendanceText
                    }
                  >
                    Event:{' '}
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      {
                        record.event_title
                      }
                    </Text>
                  </Text>

                  <Text
                    style={
                      styles.attendanceText
                    }
                  >
                    Status:{' '}
                    <Text
                      style={[
                        styles.boldText,
                        {
                          color:
                            record.status ===
                            'present'
                              ? '#16a34a'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {
                        record.status
                      }
                    </Text>
                  </Text>

                  <Text
                    style={
                      styles.attendanceText
                    }
                  >
                    Scanned:{' '}
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      {formatDate(
                        record.scanned_at
                      )}
                    </Text>
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.removeAttendanceButton
                  }
                  onPress={() =>
                    removeAttendance(
                      record
                    )
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    REMOVE RECORD
                  </Text>
                </Pressable>
              </View>
            )
          )
        )}

        {/* REPORT */}

        <SectionTitle
          icon="bar-chart"
          title="System Records / Reports"
        />

        <View
          style={
            styles.reportCard
          }
        >
          <ReportRow
            label="Total Users"
            value={
              users.length
            }
          />

          <ReportRow
            label="Students"
            value={
              users.filter(
                (user) =>
                  user.role ===
                  'student'
              ).length
            }
          />

          <ReportRow
            label="Teachers"
            value={
              users.filter(
                (user) =>
                  user.role ===
                  'teacher'
              ).length
            }
          />

          <ReportRow
            label="Administrators"
            value={
              users.filter(
                (user) =>
                  user.role ===
                  'admin'
              ).length
            }
          />

          <ReportRow
            label="Total Events"
            value={
              events.length
            }
          />

          <ReportRow
            label="Open Events"
            value={
              events.filter(
                (event) =>
                  event.status !==
                  'closed'
              ).length
            }
          />

          <ReportRow
            label="Closed Events"
            value={
              events.filter(
                (event) =>
                  event.status ===
                  'closed'
              ).length
            }
          />

          <ReportRow
            label="Attendance Records"
            value={
              attendance.length
            }
          />
        </View>

        {/* BOTTOM LOGOUT */}

        <Pressable
          style={
            styles.bottomLogout
          }
          onPress={
            handleLogout
          }
          disabled={
            loggingOut
          }
        >
          {loggingOut ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={21}
                color="#ffffff"
              />

              <Text
                style={
                  styles.logoutText
                }
              >
                LOGOUT
              </Text>
            </>
          )}
        </Pressable>

        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>
    </SafeAreaView>
  );
}

/*
==========================================
SECTION TITLE
==========================================
*/

function SectionTitle({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View
      style={
        styles.sectionTitleContainer
      }
    >
      <Ionicons
        name={icon}
        size={25}
        color="#0f172a"
      />

      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>
    </View>
  );
}

/*
==========================================
EMPTY CARD
==========================================
*/

function EmptyCard({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.emptyCard
      }
    >
      <Ionicons
        name="file-tray-outline"
        size={35}
        color="#94a3b8"
      />

      <Text
        style={
          styles.emptyText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/*
==========================================
REPORT ROW
==========================================
*/

function ReportRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.reportRow
      }
    >
      <Text
        style={
          styles.reportLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.reportValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/*
==========================================
STYLES
==========================================
*/

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#f1f5f9',
    },

    content: {
      paddingBottom: 40,
    },

    loadingScreen: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#f1f5f9',
      padding: 30,
    },

    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: '#64748b',
      textAlign: 'center',
    },

    errorScreen: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#f1f5f9',
      padding: 30,
    },

    errorTitle: {
      fontSize: 25,
      fontWeight: '800',
      color: '#0f172a',
      textAlign: 'center',
      marginTop: 15,
      marginBottom: 10,
    },

    errorMessage: {
      fontSize: 15,
      color: '#64748b',
      textAlign: 'center',
      marginBottom: 25,
      maxWidth: 600,
    },

    header: {
      backgroundColor:
        '#0f172a',
      paddingHorizontal: 25,
      paddingTop: 30,
      paddingBottom: 30,
    },

    headerTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    headerTitle: {
      fontSize: 34,
      fontWeight: '900',
      color: '#ffffff',
    },

    headerSubtitle: {
      fontSize: 16,
      color: '#cbd5e1',
      marginTop: 5,
    },

    headerLogout: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        '#ef4444',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    adminBadge: {
      flexDirection:
        'row',
      alignItems:
        'center',
      alignSelf:
        'flex-start',
      backgroundColor:
        '#dbeafe',
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 20,
      marginHorizontal: 25,
      marginTop: 20,
      gap: 8,
    },

    adminBadgeText: {
      color: '#1d4ed8',
      fontWeight: '700',
      fontSize: 14,
    },

    statsContainer: {
      flexDirection:
        'row',
      paddingHorizontal: 25,
      marginTop: 20,
      gap: 12,
    },

    statCard: {
      flex: 1,
      backgroundColor:
        '#ffffff',
      borderRadius: 16,
      padding: 18,
      alignItems:
        'center',
      justifyContent:
        'center',
      shadowColor:
        '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 2,
    },

    statIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        '#eff6ff',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 8,
    },

    statNumber: {
      fontSize: 27,
      fontWeight: '900',
      color: '#2563eb',
    },

    statLabel: {
      marginTop: 3,
      fontSize: 14,
      color: '#64748b',
    },

    sectionTitleContainer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 25,
      marginTop: 32,
      marginBottom: 15,
      gap: 10,
    },

    sectionTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: '#0f172a',
    },

    card: {
      backgroundColor:
        '#ffffff',
      borderRadius: 18,
      marginHorizontal: 25,
      marginBottom: 15,
      padding: 20,
      shadowColor:
        '#000000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 2,
    },

    cardHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    attendanceHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 12,
    },

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor:
        '#eff6ff',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 13,
    },

    cardHeaderText: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#0f172a',
    },

    cardEmail: {
      fontSize: 14,
      color: '#64748b',
      marginTop: 4,
    },

    infoRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 17,
      gap: 8,
    },

    infoLabel: {
      fontSize: 15,
      color: '#64748b',
    },

    roleBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 15,
    },

    adminRole: {
      backgroundColor:
        '#ede9fe',
    },

    teacherRole: {
      backgroundColor:
        '#dcfce7',
    },

    studentRole: {
      backgroundColor:
        '#dbeafe',
    },

    roleText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#334155',
    },

    blueButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#2563eb',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 16,
      gap: 8,
    },

    primaryButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#2563eb',
      paddingHorizontal: 25,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      minWidth: 170,
    },

    primaryButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '900',
    },

    logoutButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#ef4444',
      paddingHorizontal: 25,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      minWidth: 170,
      marginTop: 12,
    },

    logoutButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '900',
    },

    buttonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '900',
    },

    eventTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: 10,
    },

    eventTitleContainer: {
      flex: 1,
    },

    eventCode: {
      fontSize: 14,
      color: '#64748b',
      marginTop: 5,
      fontWeight: '600',
    },

    statusBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 15,
    },

    openBadge: {
      backgroundColor:
        '#dcfce7',
    },

    closedBadge: {
      backgroundColor:
        '#fee2e2',
    },

    statusText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#334155',
    },

    detailRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 12,
      gap: 8,
    },

    detailText: {
      flex: 1,
      color: '#64748b',
      fontSize: 14,
    },

    description: {
      marginTop: 13,
      color: '#475569',
      fontSize: 14,
      lineHeight: 21,
    },

    buttonRow: {
      flexDirection:
        'row',
      gap: 10,
      marginTop: 18,
    },

    orangeButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#f97316',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 7,
    },

    redButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#dc2626',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 7,
    },

    attendanceDetails: {
      marginBottom: 15,
    },

    attendanceText: {
      color: '#64748b',
      fontSize: 14,
      marginBottom: 7,
    },

    boldText: {
      fontWeight: '800',
      color: '#334155',
    },

    removeAttendanceButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#dc2626',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 8,
      alignSelf:
        'flex-start',
    },

    emptyCard: {
      backgroundColor:
        '#ffffff',
      borderRadius: 18,
      marginHorizontal: 25,
      padding: 35,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    emptyText: {
      color: '#64748b',
      fontSize: 15,
      marginTop: 10,
      textAlign: 'center',
    },

    reportCard: {
      backgroundColor:
        '#ffffff',
      borderRadius: 18,
      marginHorizontal: 25,
      padding: 20,
    },

    reportRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor:
        '#e2e8f0',
    },

    reportLabel: {
      fontSize: 15,
      color: '#475569',
    },

    reportValue: {
      fontSize: 19,
      fontWeight: '900',
      color: '#2563eb',
    },

    bottomLogout: {
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginHorizontal: 25,
      marginTop: 30,
      backgroundColor:
        '#dc2626',
      paddingVertical: 15,
      borderRadius: 12,
      gap: 8,
    },

    logoutText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '900',
    },

    bottomSpace: {
      height: 40,
    },
  });
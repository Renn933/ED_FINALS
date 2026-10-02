import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import {
  createEvent,
  updateEvent,
  closeEvent,
  deleteEvent,
  getTeacherEvents,
  type Event,
} from '@/lib/events';

import {
  buildQRPayload,
} from '@/lib/qr';

import {
  getAttendanceForEvent,
} from '@/lib/attendance';

import {
  supabase,
} from '@/lib/supabase';

export default function TeacherScreen() {

  const router = useRouter();

  // ============================================
  // EVENTS
  // ============================================

  const [
    events,
    setEvents,
  ] = useState<Event[]>([]);

  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<Event | null>(
    null
  );

  // ============================================
  // MODALS
  // ============================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    showQR,
    setShowQR,
  ] = useState(false);

  const [
    showAttendance,
    setShowAttendance,
  ] = useState(false);

  // ============================================
  // EDITING
  // ============================================

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null
  );

  // ============================================
  // FORM
  // ============================================

  const [
    title,
    setTitle,
  ] = useState('');

  const [
    eventCode,
    setEventCode,
  ] = useState('');

  const [
    venue,
    setVenue,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    startTime,
    setStartTime,
  ] = useState('');

  const [
    endTime,
    setEndTime,
  ] = useState('');

  // ============================================
  // ATTENDANCE
  // ============================================

  const [
    attendance,
    setAttendance,
  ] = useState<any[]>([]);


  // ============================================
  // LOAD TEACHER EVENTS
  // ============================================

  async function loadEvents() {

    try {

      console.log(
        'TEACHER: LOADING EVENTS'
      );

      const {
        data,
        error,
      } = await getTeacherEvents();

      if (error) {

        console.log(
          'TEACHER EVENTS ERROR:',
          error.message
        );

        Alert.alert(
          'Error',
          error.message
        );

        return;
      }

      setEvents(
        data ?? []
      );

      console.log(
        'TEACHER: EVENTS LOADED:',
        data?.length ?? 0
      );

    } catch (error: any) {

      console.log(
        'TEACHER EVENTS EXCEPTION:',
        error?.message
      );

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to load events.'
      );
    }
  }


  // ============================================
  // LOAD EVENTS WHEN SCREEN OPENS
  // ============================================

  useFocusEffect(
    useCallback(() => {

      loadEvents();

    }, [])
  );


  // ============================================
  // CLEAR FORM
  // ============================================

  function clearForm() {

    setTitle('');

    setEventCode('');

    setVenue('');

    setDescription('');

    setStartTime('');

    setEndTime('');

    setEditingId(null);
  }


  // ============================================
  // OPEN CREATE EVENT
  // ============================================

  function openCreate() {

    clearForm();

    setShowForm(true);
  }


  // ============================================
  // OPEN EDIT EVENT
  // ============================================

  function openEdit(
    event: Event
  ) {

    setEditingId(
      event.id
    );

    setTitle(
      event.title
    );

    setEventCode(
      event.event_code
    );

    setVenue(
      event.venue
    );

    setDescription(
      event.description ?? ''
    );

    setStartTime(
      event.start_time
    );

    setEndTime(
      event.end_time
    );

    setShowForm(true);
  }


  // ============================================
  // SAVE EVENT
  // ============================================

  async function handleSave() {

    // ========================================
    // VALIDATION
    // ========================================

    if (!title.trim()) {

      Alert.alert(
        'Validation',
        'Event title is required.'
      );

      return;
    }


    if (!eventCode.trim()) {

      Alert.alert(
        'Validation',
        'Event code is required.'
      );

      return;
    }


    if (!venue.trim()) {

      Alert.alert(
        'Validation',
        'Venue is required.'
      );

      return;
    }


    if (!startTime.trim()) {

      Alert.alert(
        'Validation',
        'Start time is required.'
      );

      return;
    }


    if (!endTime.trim()) {

      Alert.alert(
        'Validation',
        'End time is required.'
      );

      return;
    }


    // ========================================
    // DATE VALIDATION
    // ========================================

    const start =
      new Date(startTime);

    const end =
      new Date(endTime);


    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {

      Alert.alert(
        'Validation',
        'Use a valid date/time format.'
      );

      return;
    }


    if (end <= start) {

      Alert.alert(
        'Validation',
        'End time must be after start time.'
      );

      return;
    }


    // ========================================
    // UPDATE EVENT
    // ========================================

    if (editingId) {

      console.log(
        'TEACHER: UPDATING EVENT'
      );

      const {
        error,
      } = await updateEvent(
        editingId,
        {
          event_code:
            eventCode.trim(),

          title:
            title.trim(),

          venue:
            venue.trim(),

          description:
            description.trim(),

          start_time:
            start.toISOString(),

          end_time:
            end.toISOString(),
        }
      );


      if (error) {

        Alert.alert(
          'Error',
          error.message
        );

        return;
      }


      Alert.alert(
        'Success',
        'Event updated successfully.'
      );
    }


    // ========================================
    // CREATE EVENT
    // ========================================

    else {

      console.log(
        'TEACHER: CREATING EVENT'
      );

      const {
        error,
      } = await createEvent({

        event_code:
          eventCode.trim(),

        title:
          title.trim(),

        venue:
          venue.trim(),

        description:
          description.trim(),

        start_time:
          start.toISOString(),

        end_time:
          end.toISOString(),

      });


      if (error) {

        Alert.alert(
          'Error',
          error.message
        );

        return;
      }


      Alert.alert(
        'Success',
        'Event created successfully.'
      );
    }


    setShowForm(false);

    clearForm();

    await loadEvents();
  }


  // ============================================
  // SHOW QR CODE
  // ============================================

  function handleShowQR(
    event: Event
  ) {

    console.log(
      'TEACHER: SHOWING QR:',
      event.event_code
    );

    setSelectedEvent(
      event
    );

    setShowQR(true);
  }


  // ============================================
  // CLOSE EVENT
  // ============================================

  async function handleClose(
    event: Event
  ) {

    Alert.alert(
      'Close Event',
      `Close "${event.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Close',
          style: 'destructive',

          onPress: async () => {

            try {

              console.log(
                'TEACHER: CLOSING EVENT:',
                event.id
              );

              const {
                error,
              } = await closeEvent(
                event.id
              );


              if (error) {

                Alert.alert(
                  'Error',
                  error.message
                );

                return;
              }


              Alert.alert(
                'Success',
                'Event closed successfully.'
              );


              await loadEvents();

            } catch (error: any) {

              Alert.alert(
                'Error',
                error?.message ||
                  'Unable to close event.'
              );
            }
          },
        },
      ]
    );
  }


  // ============================================
  // DELETE EVENT
  // ============================================

  async function handleDelete(
    event: Event
  ) {

    Alert.alert(
      'Delete Event',
      `Delete "${event.title}"?`,
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

              console.log(
                'TEACHER: DELETING EVENT:',
                event.id
              );

              const {
                error,
              } = await deleteEvent(
                event.id
              );


              if (error) {

                Alert.alert(
                  'Error',
                  error.message
                );

                return;
              }


              Alert.alert(
                'Success',
                'Event deleted successfully.'
              );


              await loadEvents();

            } catch (error: any) {

              Alert.alert(
                'Error',
                error?.message ||
                  'Unable to delete event.'
              );
            }
          },
        },
      ]
    );
  }


  // ============================================
  // VIEW ATTENDANCE
  // ============================================

  async function handleAttendance(
    event: Event
  ) {

    console.log(
      'TEACHER: LOADING ATTENDANCE:',
      event.id
    );


    try {

      const {
        data,
        error,
      } = await getAttendanceForEvent(
        event.id
      );


      if (error) {

        Alert.alert(
          'Error',
          error.message
        );

        return;
      }


      setSelectedEvent(
        event
      );

      setAttendance(
        data ?? []
      );

      setShowAttendance(
        true
      );

    } catch (error: any) {

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to load attendance.'
      );
    }
  }


  // ============================================
  // LOGOUT
  // ============================================

  async function handleLogout() {

    console.log(
      '================================'
    );

    console.log(
      'TEACHER LOGOUT BUTTON PRESSED'
    );

    console.log(
      '================================'
    );


    try {

      console.log(
        'TEACHER: SIGNING OUT FROM SUPABASE...'
      );


      /*
       * Direct local logout.
       *
       * This avoids Alert.alert()
       * before the logout process.
       *
       * It is useful for Expo Web.
       */

      const {
        error,
      } = await supabase.auth.signOut({
        scope: 'local',
      });


      if (error) {

        console.log(
          'TEACHER LOGOUT ERROR:',
          error.message
        );


        Alert.alert(
          'Logout Error',
          error.message
        );


        return;
      }


      console.log(
        'TEACHER: SUPABASE LOGOUT SUCCESS'
      );


      console.log(
        'TEACHER: REDIRECTING TO LOGIN...'
      );


      router.replace(
        '/login'
      );


    } catch (error: any) {

      console.log(
        'TEACHER LOGOUT EXCEPTION:',
        error?.message
      );


      Alert.alert(
        'Logout Error',
        error?.message ||
          'Unable to logout.'
      );
    }
  }


  // ============================================
  // SCREEN
  // ============================================

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Teacher Dashboard
        </Text>


        <Text
          style={styles.subtitle}
        >
          Create and manage school
          events
        </Text>

      </View>


      {/* ====================================== */}
      {/* CREATE EVENT BUTTON */}
      {/* ====================================== */}

      <Pressable
        style={styles.createButton}
        onPress={openCreate}
      >

        <Text
          style={
            styles.createButtonText
          }
        >
          + CREATE EVENT
        </Text>

      </Pressable>


      {/* ====================================== */}
      {/* MY EVENTS */}
      {/* ====================================== */}

      <Text
        style={styles.sectionTitle}
      >
        My Events
      </Text>


      {events.length === 0 ? (

        <View
          style={styles.empty}
        >

          <Text
            style={styles.emptyText}
          >
            You have not created
            any events yet.
          </Text>

        </View>

      ) : (

        events.map(
          (event) => (

            <View
              key={event.id}
              style={styles.card}
            >

              {/* CARD HEADER */}

              <View
                style={styles.cardHeader}
              >

                <View
                  style={styles.info}
                >

                  <Text
                    style={
                      styles.eventTitle
                    }
                  >
                    {event.title}
                  </Text>


                  <Text
                    style={styles.code}
                  >
                    {event.event_code}
                  </Text>

                </View>


                {/* STATUS */}

                <View
                  style={[
                    styles.status,

                    event.status ===
                    'open'
                      ? styles.open
                      : styles.closed,
                  ]}
                >

                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {
                      event.status
                        .toUpperCase()
                    }
                  </Text>

                </View>

              </View>


              {/* VENUE */}

              <Text
                style={styles.detail}
              >
                📍 {event.venue}
              </Text>


              {/* START TIME */}

              <Text
                style={styles.detail}
              >
                🕒{' '}
                {new Date(
                  event.start_time
                ).toLocaleString()}
              </Text>


              {/* END TIME */}

              <Text
                style={styles.detail}
              >
                🕒 End:{' '}
                {new Date(
                  event.end_time
                ).toLocaleString()}
              </Text>


              {/* DESCRIPTION */}

              {event.description ? (

                <Text
                  style={
                    styles.description
                  }
                >
                  {event.description}
                </Text>

              ) : null}


              {/* ACTION BUTTONS */}

              <View
                style={styles.actions}
              >

                {/* QR */}

                {event.status ===
                'open' ? (

                  <Pressable
                    style={
                      styles.actionBlue
                    }
                    onPress={() =>
                      handleShowQR(
                        event
                      )
                    }
                  >

                    <Text
                      style={
                        styles.actionText
                      }
                    >
                      QR
                    </Text>

                  </Pressable>

                ) : null}


                {/* EDIT */}

                <Pressable
                  style={
                    styles.actionGray
                  }
                  onPress={() =>
                    openEdit(event)
                  }
                >

                  <Text
                    style={
                      styles.actionTextDark
                    }
                  >
                    EDIT
                  </Text>

                </Pressable>


                {/* CLOSE */}

                {event.status ===
                'open' ? (

                  <Pressable
                    style={
                      styles.actionOrange
                    }
                    onPress={() =>
                      handleClose(
                        event
                      )
                    }
                  >

                    <Text
                      style={
                        styles.actionText
                      }
                    >
                      CLOSE
                    </Text>

                  </Pressable>

                ) : null}


                {/* ATTENDANCE */}

                <Pressable
                  style={
                    styles.actionGreen
                  }
                  onPress={() =>
                    handleAttendance(
                      event
                    )
                  }
                >

                  <Text
                    style={
                      styles.actionText
                    }
                  >
                    ATTENDANCE
                  </Text>

                </Pressable>


                {/* DELETE */}

                <Pressable
                  style={
                    styles.actionRed
                  }
                  onPress={() =>
                    handleDelete(
                      event
                    )
                  }
                >

                  <Text
                    style={
                      styles.actionText
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


      {/* ====================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ====================================== */}

      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() =>
          setShowForm(false)
        }
      >

        <ScrollView
          style={
            styles.modalContainer
          }
          contentContainerStyle={
            styles.modalContent
          }
        >

          <Text
            style={styles.modalTitle}
          >
            {editingId
              ? 'Edit Event'
              : 'Create Event'}
          </Text>


          {/* EVENT NAME */}

          <Text
            style={styles.label}
          >
            Event Name
          </Text>


          <TextInput
            style={styles.input}
            placeholder="School Foundation Day"
            value={title}
            onChangeText={setTitle}
          />


          {/* EVENT CODE */}

          <Text
            style={styles.label}
          >
            Event Code
          </Text>


          <TextInput
            style={styles.input}
            placeholder="EVT-2026-001"
            value={eventCode}
            onChangeText={
              setEventCode
            }
            autoCapitalize="characters"
          />


          {/* VENUE */}

          <Text
            style={styles.label}
          >
            Venue
          </Text>


          <TextInput
            style={styles.input}
            placeholder="School Gymnasium"
            value={venue}
            onChangeText={setVenue}
          />


          {/* DESCRIPTION */}

          <Text
            style={styles.label}
          >
            Description
          </Text>


          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            placeholder="Event description"
            value={description}
            onChangeText={
              setDescription
            }
            multiline
          />


          {/* START DATE/TIME */}

          <Text
            style={styles.label}
          >
            Start Date/Time
          </Text>


          <TextInput
            style={styles.input}
            placeholder="2026-10-02T09:00:00"
            value={startTime}
            onChangeText={
              setStartTime
            }
          />


          <Text
            style={styles.helper}
          >
            Example:
            2026-10-02T09:00:00
          </Text>


          {/* END DATE/TIME */}

          <Text
            style={styles.label}
          >
            End Date/Time
          </Text>


          <TextInput
            style={styles.input}
            placeholder="2026-10-02T12:00:00"
            value={endTime}
            onChangeText={
              setEndTime
            }
          />


          <Text
            style={styles.helper}
          >
            Example:
            2026-10-02T12:00:00
          </Text>


          {/* SAVE */}

          <Pressable
            style={
              styles.saveButton
            }
            onPress={
              handleSave
            }
          >

            <Text
              style={
                styles.saveButtonText
              }
            >
              {editingId
                ? 'UPDATE EVENT'
                : 'CREATE EVENT'}
            </Text>

          </Pressable>


          {/* CANCEL */}

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={() => {

              setShowForm(false);

              clearForm();

            }}
          >

            <Text
              style={
                styles.cancelButtonText
              }
            >
              CANCEL
            </Text>

          </Pressable>

        </ScrollView>

      </Modal>


      {/* ====================================== */}
      {/* QR MODAL */}
      {/* ====================================== */}

      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowQR(false)
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={styles.qrModal}
          >

            <Text
              style={styles.qrTitle}
            >
              Event QR Code
            </Text>


            <Text
              style={styles.qrEvent}
            >
              {selectedEvent?.title}
            </Text>


            {selectedEvent ? (

              <QRCode
                value={
                  buildQRPayload(
                    selectedEvent.event_code
                  )
                }
                size={230}
              />

            ) : null}


            <Text
              style={styles.qrCode}
            >
              {selectedEvent?.event_code}
            </Text>


            <Pressable
              style={
                styles.cancelButton
              }
              onPress={() =>
                setShowQR(false)
              }
            >

              <Text
                style={
                  styles.cancelButtonText
                }
              >
                CLOSE
              </Text>

            </Pressable>

          </View>

        </View>

      </Modal>


      {/* ====================================== */}
      {/* ATTENDANCE MODAL */}
      {/* ====================================== */}

      <Modal
        visible={showAttendance}
        animationType="slide"
        onRequestClose={() =>
          setShowAttendance(false)
        }
      >

        <ScrollView
          style={
            styles.modalContainer
          }
          contentContainerStyle={
            styles.modalContent
          }
        >

          <Text
            style={styles.modalTitle}
          >
            Attendance
          </Text>


          <Text
            style={styles.qrEvent}
          >
            {selectedEvent?.title}
          </Text>


          {attendance.length ===
          0 ? (

            <View
              style={styles.empty}
            >

              <Text
                style={styles.emptyText}
              >
                No attendance records
                yet.
              </Text>

            </View>

          ) : (

            attendance.map(
              (item) => (

                <View
                  key={item.id}
                  style={
                    styles.attendanceCard
                  }
                >

                  <Text
                    style={
                      styles.studentName
                    }
                  >
                    {item.profile
                      ?.full_name ||
                      'Student'}
                  </Text>


                  <Text
                    style={
                      styles.studentEmail
                    }
                  >
                    {item.profile
                      ?.email ||
                      ''}
                  </Text>


                  <Text
                    style={styles.detail}
                  >
                    {new Date(
                      item.scanned_at
                    ).toLocaleString()}
                  </Text>


                  <Text
                    style={
                      styles.present
                    }
                  >
                    {item.status.toUpperCase()}
                  </Text>

                </View>

              )
            )

          )}


          <Pressable
            style={
              styles.cancelButton
            }
            onPress={() =>
              setShowAttendance(
                false
              )
            }
          >

            <Text
              style={
                styles.cancelButtonText
              }
            >
              CLOSE
            </Text>

          </Pressable>

        </ScrollView>

      </Modal>


      {/* ====================================== */}
      {/* LOGOUT BUTTON */}
      {/* ====================================== */}

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >

        <Text
          style={
            styles.logoutButtonText
          }
        >
          LOGOUT
        </Text>

      </Pressable>

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


    content: {
      paddingBottom: 40,
    },


    // ========================================
    // HEADER
    // ========================================

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


    // ========================================
    // CREATE BUTTON
    // ========================================

    createButton: {
      margin: 20,
      height: 52,
      backgroundColor: '#16a34a',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },


    createButtonText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 15,
    },


    // ========================================
    // SECTION
    // ========================================

    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#111827',
      paddingHorizontal: 20,
      marginBottom: 12,
    },


    // ========================================
    // EMPTY
    // ========================================

    empty: {
      backgroundColor: '#fff',
      marginHorizontal: 20,
      borderRadius: 14,
      padding: 25,
      alignItems: 'center',
    },


    emptyText: {
      color: '#64748b',
    },


    // ========================================
    // EVENT CARD
    // ========================================

    card: {
      backgroundColor: '#fff',
      marginHorizontal: 20,
      marginBottom: 13,
      padding: 17,
      borderRadius: 15,

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
    },


    info: {
      flex: 1,
    },


    eventTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#111827',
    },


    code: {
      color: '#64748b',
      fontSize: 12,
      marginTop: 3,
    },


    status: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
    },


    open: {
      backgroundColor: '#dcfce7',
    },


    closed: {
      backgroundColor: '#fee2e2',
    },


    statusText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#374151',
    },


    detail: {
      color: '#475569',
      fontSize: 13,
      marginTop: 7,
    },


    description: {
      color: '#64748b',
      marginTop: 9,
      lineHeight: 19,
    },


    // ========================================
    // ACTIONS
    // ========================================

    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 15,
    },


    actionBlue: {
      backgroundColor: '#2563eb',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
    },


    actionGray: {
      backgroundColor: '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
    },


    actionOrange: {
      backgroundColor: '#ea580c',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
    },


    actionGreen: {
      backgroundColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
    },


    actionRed: {
      backgroundColor: '#dc2626',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
    },


    actionText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },


    actionTextDark: {
      color: '#334155',
      fontSize: 11,
      fontWeight: '800',
    },


    // ========================================
    // FORM MODAL
    // ========================================

    modalContainer: {
      flex: 1,
      backgroundColor: '#f5f7fb',
    },


    modalContent: {
      padding: 22,
      paddingTop: 55,
      paddingBottom: 50,
    },


    modalTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 22,
    },


    label: {
      fontSize: 14,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 7,
      marginTop: 10,
    },


    input: {
      height: 50,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 10,
      paddingHorizontal: 13,
      color: '#111827',
    },


    textArea: {
      height: 100,
      paddingTop: 13,
      textAlignVertical: 'top',
    },


    helper: {
      fontSize: 11,
      color: '#64748b',
      marginTop: 4,
    },


    saveButton: {
      height: 52,
      backgroundColor: '#2563eb',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 25,
    },


    saveButtonText: {
      color: '#fff',
      fontWeight: '800',
    },


    cancelButton: {
      height: 50,
      backgroundColor: '#e2e8f0',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },


    cancelButtonText: {
      color: '#334155',
      fontWeight: '800',
    },


    // ========================================
    // QR MODAL
    // ========================================

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },


    qrModal: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 25,
      alignItems: 'center',
      width: '100%',
    },


    qrTitle: {
      fontSize: 23,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 8,
    },


    qrEvent: {
      fontSize: 17,
      fontWeight: '700',
      color: '#475569',
      marginBottom: 20,
      textAlign: 'center',
    },


    qrCode: {
      fontSize: 13,
      color: '#64748b',
      marginTop: 15,
      marginBottom: 5,
    },


    // ========================================
    // ATTENDANCE
    // ========================================

    attendanceCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
    },


    studentName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
    },


    studentEmail: {
      fontSize: 13,
      color: '#64748b',
      marginTop: 3,
    },


    present: {
      color: '#16a34a',
      fontWeight: '800',
      fontSize: 12,
      marginTop: 7,
    },


    // ========================================
    // LOGOUT
    // ========================================

    logoutButton: {
      height: 52,
      backgroundColor: '#dc2626',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 20,
    },


    logoutButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
    },

  });
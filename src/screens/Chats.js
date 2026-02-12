import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  View,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { colors } from '../config/constants';
import ContactRow from '../components/ContactRow';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';
import { listChatsForUser, softDeleteChatForUser, subscribeToUserChats } from '../services/chatService';

const Chats = ({ setUnreadCount }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthenticatedUserContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [newMessages, setNewMessages] = useState({});
  const latestMessageByChatRef = useRef({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (selectedItems.length > 0) {
          setSelectedItems([]);
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }
    return () => {};
  }, [selectedItems.length]);

  const persistUnread = useCallback(
    async (next) => {
      await AsyncStorage.setItem('newMessages', JSON.stringify(next));
      setUnreadCount(Object.values(next).reduce((total, num) => total + num, 0));
    },
    [setUnreadCount]
  );

  const loadNewMessages = useCallback(async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('newMessages');
      const parsed = storedMessages ? JSON.parse(storedMessages) : {};
      setNewMessages(parsed);
      setUnreadCount(Object.values(parsed).reduce((total, num) => total + num, 0));
      return parsed;
    } catch (error) {
      console.log('Error loading new messages from storage', error);
      return {};
    }
  }, [setUnreadCount]);

  const loadChats = useCallback(
    async (existingNewMessages = null) => {
      if (!user?.id) return;

      const counts = existingNewMessages ?? newMessages;

      try {
        const rows = await listChatsForUser(user.id);
        const nextMap = { ...latestMessageByChatRef.current };
        const updatedCounts = { ...counts };
        let hasUnreadUpdates = false;

        rows.forEach((chat) => {
          const latest = chat.latestMessage;
          if (!latest) return;

          const previousMessageId = latestMessageByChatRef.current[chat.id];
          nextMap[chat.id] = latest.id;

          if (
            previousMessageId &&
            previousMessageId !== latest.id &&
            latest.sender_id !== user.id
          ) {
            updatedCounts[chat.id] = (updatedCounts[chat.id] || 0) + 1;
            hasUnreadUpdates = true;
          }
        });

        latestMessageByChatRef.current = nextMap;
        setChats(rows);

        if (hasUnreadUpdates) {
          setNewMessages(updatedCounts);
          await persistUnread(updatedCounts);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    },
    [newMessages, persistUnread, user?.id]
  );

  useEffect(() => {
    let unsubscribe = () => {};

    const bootstrap = async () => {
      const counts = await loadNewMessages();
      await loadChats(counts);

      if (user?.id) {
        unsubscribe = subscribeToUserChats(user.id, () => {
          loadChats();
        });
      }
    };

    bootstrap();

    return () => {
      unsubscribe();
    };
  }, [loadChats, loadNewMessages, user?.id]);

  const getChatName = useCallback(
    (chat) => {
      if (chat.groupName) return chat.groupName;
      const participants = chat.users || [];
      if (participants.length === 2) {
        const other = participants.find((participant) => participant.id !== user?.id);
        return other?.name || other?.email || '~ No Name or Email ~';
      }
      const self = participants[0];
      return self?.name || self?.email || '~ No Name or Email ~';
    },
    [user?.id]
  );

  const handleChatPress = async (chat) => {
    const chatId = chat.id;
    if (selectedItems.length) {
      selectItems(chat);
      return;
    }

    const updated = { ...newMessages, [chatId]: 0 };
    setNewMessages(updated);
    await persistUnread(updated);

    navigation.navigate('Chat', { id: chatId, chatName: getChatName(chat) });
  };

  const handleChatLongPress = (chat) => selectItems(chat);

  const selectItems = (chat) => {
    setSelectedItems((prev) =>
      prev.includes(chat.id)
        ? prev.filter((id) => id !== chat.id)
        : [...prev, chat.id]
    );
  };

  const getSelected = (chat) => selectedItems.includes(chat.id);

  const deSelectItems = useCallback(() => setSelectedItems([]), []);

  const handleFabPress = () => navigation.navigate('Users');

  const handleDeleteChat = useCallback(() => {
    Alert.alert(
      selectedItems.length > 1 ? 'Delete selected chats?' : 'Delete this chat?',
      'Messages will be removed from this device.',
      [
        {
          text: 'Delete chat',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedItems.map((chatId) => softDeleteChatForUser(chatId)));
              deSelectItems();
              await loadChats();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [deSelectItems, loadChats, selectedItems]);

  useEffect(() => {
    navigation.setOptions({
      headerRight:
        selectedItems.length > 0
          ? () => (
            <TouchableOpacity style={styles.trashBin} onPress={handleDeleteChat}>
              <Ionicons name="trash" size={24} color={colors.teal} />
            </TouchableOpacity>
          )
          : undefined,
      headerLeft:
        selectedItems.length > 0
          ? () => <Text style={styles.itemCount}>{selectedItems.length}</Text>
          : undefined,
    });
  }, [selectedItems, navigation, handleDeleteChat]);

  const getSubtitle = useCallback(
    (chat) => {
      if (!chat.latestMessage) return 'No messages yet';

      const sender = chat.users.find((participant) => participant.id === chat.latestMessage.sender_id);
      const isCurrentUser = chat.latestMessage.sender_id === user?.id;
      const userName = isCurrentUser ? 'You' : (sender?.name || sender?.email || '').split(' ')[0];
      return `${userName}: ${chat.latestMessagePreview}`;
    },
    [user?.id]
  );

  const getSubtitle2 = useCallback((chat) => {
    const { lastUpdated } = chat;
    if (!lastUpdated) return '';
    const options = { year: '2-digit', month: 'numeric', day: 'numeric' };
    return new Date(lastUpdated).toLocaleDateString(undefined, options);
  }, []);

  return (
    <Pressable style={styles.container} onPress={deSelectItems}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.teal} style={styles.loadingContainer} />
      ) : (
        <ScrollView>
          {chats.length === 0 ? (
            <View style={styles.blankContainer}>
              <Text style={styles.textContainer}>No conversations yet</Text>
            </View>
          ) : (
            chats.map((chat) => (
              <ContactRow
                key={chat.id}
                style={getSelected(chat) ? styles.selectedContactRow : undefined}
                name={getChatName(chat)}
                subtitle={getSubtitle(chat)}
                subtitle2={getSubtitle2(chat)}
                onPress={() => handleChatPress(chat)}
                onLongPress={() => handleChatLongPress(chat)}
                selected={getSelected(chat)}
                showForwardIcon={false}
                newMessageCount={newMessages[chat.id] || 0}
              />
            ))
          )}
          <View style={styles.blankContainer}>
            <Text style={{ fontSize: 12, margin: 15 }}>
              <Ionicons name="lock-open" size={12} style={{ color: '#565656' }} /> Your personal
              messages are not <Text style={{ color: colors.teal }}>end-to-end-encrypted</Text>
            </Text>
          </View>
        </ScrollView>
      )}
      <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
        <View style={styles.fabContainer}>
          <Ionicons name="chatbox-ellipses" size={24} color="white" />
        </View>
      </TouchableOpacity>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  blankContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  fab: {
    bottom: 12,
    position: 'absolute',
    right: 12,
  },
  fabContainer: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  itemCount: {
    color: colors.teal,
    fontSize: 18,
    fontWeight: '400',
    left: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    color: colors.teal,
    flex: 1,
    justifyContent: 'center',
  },
  selectedContactRow: {
    backgroundColor: colors.grey,
  },
  textContainer: {
    fontSize: 16,
  },
  trashBin: {
    color: colors.teal,
    right: 12,
  },
});

Chats.propTypes = {
  setUnreadCount: PropTypes.func,
};

export default Chats;


import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EmojiModal from 'react-native-emoji-modal';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Send, Bubble, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import {
  View,
  Keyboard,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { colors } from '../config/constants';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';
import { listMessages, sendMessage, subscribeToMessages } from '../services/messageService';
import { uploadChatImage } from '../services/storageService';

const RenderLoadingUpload = () => (
  <View style={styles.loadingContainerUpload}>
    <ActivityIndicator size="large" color={colors.teal} />
  </View>
);

const RenderLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.teal} />
  </View>
);

const RenderBubble = (props) => (
  <Bubble
    {...props}
    wrapperStyle={{
      right: { backgroundColor: colors.primary },
      left: { backgroundColor: 'lightgrey' },
    }}
  />
);

const RenderAttach = (props) => (
  <TouchableOpacity {...props} style={styles.addImageIcon}>
    <View>
      <Ionicons name="attach-outline" size={32} color={colors.teal} />
    </View>
  </TouchableOpacity>
);

const RenderInputToolbar = (props, handleEmojiPanel) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      backgroundColor: 'white',
    }}
  >
    <InputToolbar
      {...props}
      renderActions={() => RenderActions(handleEmojiPanel)}
      containerStyle={styles.inputToolbar}
    />
    <Send {...props}>
      <View style={styles.sendIconContainer}>
        <Ionicons name="send" size={24} color={colors.teal} />
      </View>
    </Send>
  </View>
);

const RenderActions = (handleEmojiPanel) => (
  <TouchableOpacity style={styles.emojiIcon} onPress={handleEmojiPanel}>
    <View>
      <Ionicons name="happy-outline" size={32} color={colors.teal} />
    </View>
  </TouchableOpacity>
);

function Chat({ route }) {
  const { user, profile } = useContext(AuthenticatedUserContext);
  const [messages, setMessages] = useState([]);
  const [modal, setModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const rows = await listMessages(route.params.id);
      setMessages(rows);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [route.params.id]);

  useEffect(() => {
    let unsubscribe = () => {};

    loadMessages();
    unsubscribe = subscribeToMessages(route.params.id, () => {
      loadMessages();
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      if (modal) {
        setModal(false);
        return true;
      }
      return false;
    });

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (modal) setModal(false);
    });

    return () => {
      unsubscribe();
      backHandler.remove();
      keyboardDidShowListener.remove();
    };
  }, [loadMessages, modal, route.params.id]);

  const onSend = useCallback(
    async (m = []) => {
      if (!m.length || !user?.id) return;

      try {
        await sendMessage({
          chatId: route.params.id,
          senderId: user.id,
          text: m[0].text,
        });
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    },
    [route.params.id, user?.id]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await uploadImageAsync(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    if (!user?.id) return;

    setUploading(true);
    try {
      const imagePath = await uploadChatImage({ chatId: route.params.id, userId: user.id, uri });
      await sendMessage({
        chatId: route.params.id,
        senderId: user.id,
        text: '',
        imagePath,
      });
    } catch (error) {
      Alert.alert('Upload failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEmojiPanel = useCallback(() => {
    setModal((prevModal) => {
      if (prevModal) {
        Keyboard.dismiss();
        return false;
      }
      Keyboard.dismiss();
      return true;
    });
  }, []);

  return (
    <>
      {uploading && RenderLoadingUpload()}
      <GiftedChat
        messages={messages}
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        onSend={(messagesArr) => onSend(messagesArr)}
        imageStyle={{ height: 212, width: 212 }}
        messagesContainerStyle={{ backgroundColor: '#fff' }}
        textInputStyle={{ backgroundColor: '#fff', borderRadius: 20 }}
        user={{
          _id: user?.id,
          name: profile?.name ?? user?.user_metadata?.name,
          avatar: profile?.avatar_url ?? 'https://i.pravatar.cc/300',
        }}
        renderBubble={(props) => RenderBubble(props)}
        renderSend={(props) => RenderAttach({ ...props, onPress: pickImage })}
        renderUsernameOnMessage
        renderAvatarOnTop
        renderInputToolbar={(props) => RenderInputToolbar(props, handleEmojiPanel)}
        minInputToolbarHeight={56}
        scrollToBottom
        onPressActionButton={handleEmojiPanel}
        scrollToBottomStyle={styles.scrollToBottomStyle}
        renderLoading={RenderLoading}
      />

      {modal && (
        <EmojiModal
          onPressOutside={handleEmojiPanel}
          modalStyle={styles.emojiModal}
          containerStyle={styles.emojiContainerModal}
          backgroundStyle={styles.emojiBackgroundModal}
          columns={5}
          emojiSize={66}
          activeShortcutColor={colors.primary}
          onEmojiSelected={async (emoji) => {
            try {
              await sendMessage({
                chatId: route.params.id,
                senderId: user?.id,
                text: emoji,
              });
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addImageIcon: {
    borderRadius: 16,
    bottom: 8,
    height: 32,
    width: 32,
  },
  emojiBackgroundModal: {},
  emojiContainerModal: {
    height: 348,
    width: 396,
  },
  emojiIcon: {
    borderRadius: 16,
    bottom: 8,
    height: 32,
    marginLeft: 4,
    width: 32,
  },
  emojiModal: {},
  inputToolbar: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: colors.grey,
    borderRadius: 22,
    borderWidth: 0.5,
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainerUpload: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  scrollToBottomStyle: {
    borderColor: colors.grey,
    borderRadius: 28,
    borderWidth: 1,
    bottom: 12,
    height: 56,
    position: 'absolute',
    right: 12,
    width: 56,
  },
  sendIconContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: colors.grey,
    borderRadius: 22,
    borderWidth: 0.5,
    height: 44,
    justifyContent: 'center',
    marginRight: 8,
    width: 44,
  },
});

Chat.propTypes = {
  route: PropTypes.object.isRequired,
};

export default Chat;



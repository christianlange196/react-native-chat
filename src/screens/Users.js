import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';

import Cell from '../components/Cell';
import { colors } from '../config/constants';
import ContactRow from '../components/ContactRow';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';
import { createOrGetDirectChat, listProfiles } from '../services/chatService';

const Users = () => {
  const navigation = useNavigation();
  const { user, profile: currentProfile } = useContext(AuthenticatedUserContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await listProfiles();
        setUsers(data);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    loadUsers();
  }, []);

  const handleNewGroup = useCallback(() => {
    navigation.navigate('Group');
  }, [navigation]);

  const handleNewUser = useCallback(() => {
    alert('New user');
  }, []);

  const handleName = useCallback(
    (profile) => {
      if (profile.name) {
        return profile.id === user?.id ? `${profile.name}*(You)` : profile.name;
      }
      return profile.email || '~ No Name or Email ~';
    },
    [user?.id]
  );

  const handleNavigate = useCallback(
    async (profile) => {
      try {
        const result = await createOrGetDirectChat(profile.id);
        const chatId =
          typeof result === 'string' ? result : result?.chat_id ?? result?.id ?? result?.[0]?.chat_id;

        if (!chatId) {
          throw new Error('Chat could not be created. Ensure create_direct_chat RPC is installed.');
        }

        navigation.navigate('Chat', { id: chatId, chatName: handleName(profile) });
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    },
    [handleName, navigation]
  );

  const handleMessageYourself = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await createOrGetDirectChat(user.id);
      const chatId =
        typeof result === 'string' ? result : result?.chat_id ?? result?.id ?? result?.[0]?.chat_id;

      if (!chatId) {
        throw new Error('Note-to-self chat could not be created.');
      }

      navigation.navigate('Chat', {
        id: chatId,
        chatName: currentProfile?.name ?? user?.user_metadata?.name ?? 'You',
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [currentProfile?.name, navigation, user?.id, user?.user_metadata?.name]);

  const handleSubtitle = useCallback(
    (profile) => (profile.id === user?.id ? 'Message yourself' : profile.about || 'User status'),
    [user?.id]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Cell
        title="New group"
        icon="people"
        tintColor={colors.teal}
        onPress={handleNewGroup}
        style={{ marginTop: 5 }}
      />
      <Cell
        title="Message yourself"
        icon="document-text"
        tintColor={colors.teal}
        onPress={handleMessageYourself}
      />
      <Cell
        title="New user"
        icon="person-add"
        tintColor={colors.teal}
        onPress={handleNewUser}
        style={{ marginBottom: 10 }}
      />

      {users.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.textContainer}>No registered users yet</Text>
        </View>
      ) : (
        <ScrollView>
          <View>
            <Text style={styles.textContainer}>Registered users</Text>
          </View>
          {users.map((profile) => (
            <React.Fragment key={profile.id}>
              <ContactRow
                name={handleName(profile)}
                subtitle={handleSubtitle(profile)}
                onPress={() => handleNavigate(profile)}
                showForwardIcon={false}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
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
  textContainer: {
    fontSize: 16,
    fontWeight: '300',
    marginLeft: 16,
  },
});

export default Users;

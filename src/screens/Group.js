import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  View,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { colors } from '../config/constants';
import ContactRow from '../components/ContactRow';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';
import { createGroupChat, listProfiles } from '../services/chatService';

const Group = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthenticatedUserContext);
  const [selectedItems, setSelectedItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');

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

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        selectedItems.length > 0 && <Text style={styles.itemCount}>{selectedItems.length}</Text>,
    });
  }, [navigation, selectedItems]);

  const handleName = (profile) => {
    if (profile.name) {
      return profile.id === user?.id ? `${profile.name}*(You)` : profile.name;
    }
    return profile.email || '~ No Name or Email ~';
  };

  const handleSubtitle = (profile) =>
    profile.id === user?.id ? 'Message yourself' : profile.about || 'User status';

  const handleOnPress = (profile) => {
    selectItems(profile);
  };

  const selectItems = (profile) => {
    setSelectedItems((prevItems) => {
      if (prevItems.includes(profile.id)) {
        return prevItems.filter((item) => item !== profile.id);
      }
      return [...prevItems, profile.id];
    });
  };

  const getSelected = (profile) => selectedItems.includes(profile.id);

  const deSelectItems = () => {
    setSelectedItems([]);
  };

  const handleFabPress = () => {
    setModalVisible(true);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Group name cannot be empty');
      return;
    }

    try {
      const memberIds = selectedItems;
      const result = await createGroupChat(groupName, memberIds);
      const chatId =
        typeof result === 'string' ? result : result?.chat_id ?? result?.id ?? result?.[0]?.chat_id;

      if (!chatId) {
        throw new Error('Group could not be created. Ensure create_group_chat RPC is installed.');
      }

      navigation.navigate('Chat', { id: chatId, chatName: groupName });
      deSelectItems();
      setModalVisible(false);
      setGroupName('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Pressable style={styles.container} onPress={deSelectItems}>
      {users.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.textContainer}>No registered users yet</Text>
        </View>
      ) : (
        <ScrollView>
          {users.map(
            (profile) =>
              profile.id !== user?.id && (
                <React.Fragment key={profile.id}>
                  <ContactRow
                    style={getSelected(profile) ? styles.selectedContactRow : {}}
                    name={handleName(profile)}
                    subtitle={handleSubtitle(profile)}
                    onPress={() => handleOnPress(profile)}
                    selected={getSelected(profile)}
                    showForwardIcon={false}
                  />
                </React.Fragment>
              )
          )}
        </ScrollView>
      )}
      {selectedItems.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <View style={styles.fabContainer}>
            <Ionicons name="arrow-forward-outline" size={24} color="white" />
          </View>
        </TouchableOpacity>
      )}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Enter Group Name</Text>
          <TextInput
            style={styles.input}
            onChangeText={setGroupName}
            value={groupName}
            placeholder="Group Name"
            onSubmitEditing={handleCreateGroup}
          />
        </View>
      </Modal>
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
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    height: 40,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
  },
  itemCount: {
    color: colors.teal,
    fontSize: 18,
    fontWeight: '400',
    right: 10,
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalView: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 5,
    margin: 20,
    padding: 35,
  },
  selectedContactRow: {
    backgroundColor: '#E0E0E0',
  },
  textContainer: {
    fontSize: 16,
  },
});

export default Group;

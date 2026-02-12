import React, { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Alert, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

import Cell from '../components/Cell';
import { colors } from '../config/constants';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';

const Profile = () => {
  const { user, profile } = useContext(AuthenticatedUserContext);

  const handleChangeName = () => {
    Alert.alert('Change Name', 'This feature is coming soon.');
  };

  const handleDisplayEmail = () => {
    Alert.alert('Display Email', `Your email is: ${profile?.email ?? user?.email ?? ''}`);
  };

  const handleChangeProfilePicture = () => {
    Alert.alert('Change Profile Picture', 'This feature is coming soon.');
  };

  const handleShowProfilePicture = () => {
    Alert.alert('Show Profile Picture', 'This feature is coming soon.');
  };

  const displayName = profile?.name ?? user?.user_metadata?.name;
  const email = profile?.email ?? user?.email;

  const initials = displayName
    ? displayName
      .split(' ')
      .map((name) => name[0])
      .join('')
    : email?.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity style={styles.avatar} onPress={handleShowProfilePicture}>
          <Text style={styles.avatarLabel}>{initials}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraIcon} onPress={handleChangeProfilePicture}>
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Cell
          title="Name"
          icon="person-outline"
          iconColor="black"
          subtitle={displayName || 'No name set'}
          secondIcon="pencil-outline"
          onPress={handleChangeName}
          style={styles.cell}
        />

        <Cell
          title="Email"
          subtitle={email}
          icon="mail-outline"
          iconColor="black"
          secondIcon="pencil-outline"
          onPress={handleDisplayEmail}
          style={styles.cell}
        />

        <Cell
          title="About"
          subtitle={profile?.about ?? 'Available'}
          icon="information-circle-outline"
          iconColor="black"
          secondIcon="pencil-outline"
          onPress={() => Alert.alert('About', 'This feature is coming soon.')}
          style={styles.cell}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
    position: 'relative',
  },
  avatarLabel: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraIcon: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 18,
    bottom: 4,
    elevation: 5,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 36,
  },
  cell: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 0.5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  infoContainer: {
    marginTop: 40,
    width: '90%',
  },
});

export default Profile;

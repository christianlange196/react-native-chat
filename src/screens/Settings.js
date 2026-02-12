import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Linking, StyleSheet, TouchableOpacity } from 'react-native';

import Cell from '../components/Cell';
import { colors } from '../config/constants';
import ContactRow from '../components/ContactRow';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';

const Settings = ({ navigation }) => {
  const { user, profile } = useContext(AuthenticatedUserContext);

  async function openGithub(url) {
    await Linking.openURL(url);
  }

  return (
    <View>
      <ContactRow
        name={profile?.name ?? user?.user_metadata?.name ?? 'No name'}
        subtitle={profile?.email ?? user?.email}
        style={styles.contactRow}
        onPress={() => {
          navigation.navigate('Profile');
        }}
      />

      <Cell
        title="Account"
        subtitle="Privacy, logout, delete account"
        icon="key-outline"
        onPress={() => {
          navigation.navigate('Account');
        }}
        iconColor="black"
        style={{ marginTop: 20 }}
      />

      <Cell
        title="Help"
        subtitle="Contact us, app info"
        icon="help-circle-outline"
        iconColor="black"
        onPress={() => {
          navigation.navigate('Help');
        }}
      />

      <Cell
        title="Invite a friend"
        icon="people-outline"
        iconColor="black"
        onPress={() => {
          alert('Share touched');
        }}
        showForwardIcon={false}
      />

      <TouchableOpacity
        style={styles.githubLink}
        onPress={() => openGithub('https://github.com/Ctere1/react-native-chat')}
      >
        <View style={styles.githubContainer}>
          <Ionicons name="logo-github" size={12} style={{ color: colors.teal }} />
          <Text style={{ fontSize: 12, fontWeight: '400', marginLeft: 4 }}>App&apos;s Github</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  contactRow: {
    backgroundColor: 'white',
    borderColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  githubContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  githubLink: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 20,
    justifyContent: 'center',
    marginTop: 20,
    width: 100,
  },
});

Settings.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default Settings;

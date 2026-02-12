import React, { useContext } from 'react';
import { View, Alert } from 'react-native';

import Cell from '../components/Cell';
import { colors } from '../config/constants';
import { AuthenticatedUserContext } from '../contexts/AuthenticatedUserContext';
import { deleteAccount, signOut } from '../services/authService';

const Account = () => {
  const { user } = useContext(AuthenticatedUserContext);

  const onSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Error logging out: ', error);
    }
  };

  const onDeleteAccount = async () => {
    try {
      await deleteAccount();
      await signOut();
    } catch (error) {
      console.log('Error deleting account: ', error);
      Alert.alert('Delete account failed', error.message);
    }
  };

  return (
    <View>
      <Cell
        title="Blocked Users"
        icon="close-circle-outline"
        tintColor={colors.primary}
        onPress={() => {
          alert('Blocked users touched');
        }}
        style={{ marginTop: 20 }}
      />
      <Cell
        title="Logout"
        icon="log-out-outline"
        tintColor={colors.grey}
        onPress={() => {
          Alert.alert(
            'Logout?',
            'You have to login again',
            [
              {
                text: 'Logout',
                onPress: () => {
                  onSignOut();
                },
              },
              {
                text: 'Cancel',
              },
            ],
            { cancelable: true }
          );
        }}
        showForwardIcon={false}
      />
      <Cell
        title="Delete my account"
        icon="trash-outline"
        tintColor={colors.red}
        onPress={() => {
          Alert.alert(
            'Delete account?',
            `Deleting account ${user?.email ?? ''} will erase your message history`,
            [
              {
                text: 'Delete my account',
                onPress: () => {
                  onDeleteAccount();
                },
              },
              {
                text: 'Cancel',
              },
            ],
            { cancelable: true }
          );
        }}
        showForwardIcon={false}
        style={{ marginTop: 20 }}
      />
    </View>
  );
};

export default Account;

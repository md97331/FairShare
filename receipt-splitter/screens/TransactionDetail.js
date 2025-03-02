import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const TransactionDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { transaction } = route.params || {};

  // Helper: Format date from ISO string or Firestore timestamp
  const formatDate = (dateObj) => {
    if (typeof dateObj === 'string') {
      return new Date(dateObj).toLocaleString();
    } else if (dateObj && dateObj._seconds) {
      return new Date(dateObj._seconds * 1000).toLocaleString();
    } else {
      return 'Unknown date';
    }
  };

  // Helper: Format currency to two decimals
  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No transaction data available.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{transaction.name}</Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summaryText}>Fees: {transaction.fees ? formatCurrency(transaction.fees) : 'None'}</Text>
          <Text style={styles.summaryText}>Total: {formatCurrency(transaction.total)}</Text>
          <Text style={styles.summaryText}>
            Created At: {formatDate(transaction.createdAt)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users & Items</Text>
          {transaction.users && transaction.users.length > 0 ? (
            transaction.users.map((user, index) => (
              <View key={index} style={styles.userContainer}>
                <Text style={styles.userHeader}>
                  {user.userId}{user.userId === transaction.userIds[0] ? " (You)" : ""}
                </Text>
                {user.items && user.items.length > 0 ? (
                  user.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No items listed.</Text>
                )}
                <Text style={styles.userTotal}>User Total: {formatCurrency(user.total)}</Text>
                <Text style={styles.userSplit}>Split: {formatCurrency(user.splitAmount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No user details available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  userContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  userHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 15,
    color: '#333',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'green',
  },
  userTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  userSplit: {
    fontSize: 15,
    color: '#555',
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default TransactionDetail;
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const HomeScreen = () => {
  const recentTransactions = [
    { id: '1', name: 'Dinner with Friends', amount: '$45.00' }, 
    { id: '2', name: 'Grocery Split', amount: '$30.75' },
    { id: '3', name: 'Movie Night', amount: '$25.00' },
  ];

  const handleCreateBill = () => {
    alert('Create Bill Clicked!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FairShare!</Text>
      
      {/* Create Bill Button */}
      <TouchableOpacity style={styles.button} onPress={handleCreateBill}>
        <Text style={styles.buttonText}>+ Create Bill</Text>
      </TouchableOpacity>

      {/* Recent Transactions List */}
      <Text style={styles.subtitle}>Recent Transactions</Text>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <Text style={styles.transactionText}>{item.name}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 45,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
  },
  transactionText: {
    fontSize: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default HomeScreen;

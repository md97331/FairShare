import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity   } from 'react-native';
import { useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons for the reload icon
import { API_BASE_URL } from '@env'; 


const userId="mario@com"; // USER ID HARDCODED FOR TESTING
const GET_TRANSACTION = API_BASE_URL+"transactions/userRange/USERA?";
const GET_TOTAL_TRANSACTIONS = API_BASE_URL+"transactions/count/"+userId;

const HomeScreen = () => {
  // const recentTransactions = [
  //   { id: '1', name: 'Dinner with Friends', amount: '$45.00' }, 
  //   { id: '2', name: 'Grocery Split', amount: '$30.75' },
  //   { id: '3', name: 'Movie Night', amount: '$25.00' },
  // ];

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [tranactionCount,setTransactionCount]=useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactionsCount = async () => {
    try {
      const response = await fetch(GET_TRANSACTION+"startIndex=0&endIndex="+tranactionCount);
      const data = await response.json();
      setTransactionCount(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTransactions = async () => {
    try {
      const response = await fetch(GET_TOTAL_TRANSACTIONS);
      const data = await response.json();
      console.log(data);
      setRecentTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

   // Fetch Data from API
   useEffect(() => {
    fetchTransactionsCount().then(
      ()=>{
        fetchTransactions();
      }
    )
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FairShare!</Text>
      {loading?(
        <ActivityIndicator size="large" color="#007bff" />
      ):
      (<>
        <Text style={styles.subtitle}>Recent Transactions</Text>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <Text style={styles.transactionText}>{item.name}</Text>
            <Text style={styles.amount}>${item.total}</Text>
          </View>
        )}
        ></FlatList>
       <TouchableOpacity style={styles.floatingButton} onPress={fetchTransactions}>
        <MaterialIcons name="refresh" size={28} color="white" />
      </TouchableOpacity>
      </>
    )
      }
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // For Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
});

export default HomeScreen;

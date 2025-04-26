import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUp from './SignUp';
import SignIn from './SignIn';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer> {/* <-- SEUL NavigationContainer autorisé */}
      <Stack.Navigator initialRouteName="SignUp">
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="SignIn" component={SignIn} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
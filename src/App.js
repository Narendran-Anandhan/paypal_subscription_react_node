import { useEffect, useState } from "react";
import axios from "axios"
import {
	PayPalScriptProvider,
	PayPalButtons,
	usePayPalScriptReducer
} from "@paypal/react-paypal-js";


const ButtonWrapper = ({ type }) => {
	const [{ options }, dispatch] = usePayPalScriptReducer();

	useEffect(() => {
        dispatch({
            type: "resetOptions",
            value: {
                ...options,
                intent: "subscription",
            },
        });
    }, [type]);

	return (<PayPalButtons
		createSubscription={(data, actions) => {
      axios
      .post(
        'http://localhost:4000/api/paypal/create-subscription', { userAction: "SUBSCRIBE_NOW" }
      )
      .then((response) => {
        console.log(response);
        return actions.subscription
				.create({
					plan_id: "P-3RX065706M3469222L5IFM4I",
				});
      })
      .catch((error)=>{
          console.log(error)
      });
		}}

    onApprove = {(data, actions)  =>{
      alert('You have successfully subscribed to' + data.subscriptionID); // Optional message given to subscriber
    }}
  
		style={{
			label: "subscribe",
		}}
	/>);
}

export default function App() {

  const [flag, setFlag] = useState(false);
  const getPlan = (e) =>{
    e.preventDefault();
    axios
    .get(
      'http://localhost:4000/api/paypal/create-plan'
    )
    .then((response) => {
      console.log(response);
     setFlag(true);
    })
    .catch((error)=>{
        console.log(error)
    });
  
  
  }
  

	return (
    <>
     <button onClick={(e)=>{getPlan(e)}}>
Create a plan
</button>
{flag ? <PayPalScriptProvider
  options={{
    clientId: "test",
    components: "buttons",
    intent: "subscription",
    vault: true,
  }}
>
  <ButtonWrapper type="subscription" />
</PayPalScriptProvider>
: ''
}

    </>
   
			);
}
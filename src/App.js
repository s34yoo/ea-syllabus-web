import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

function App() {
  const session = useSession(); // tokens
  const supabase = useSupabaseClient(); // talk to  supabase
  
  async function createCalenderEvent() {
    const event = {
      'summary': 'Google I/O 2015',
      'location': '800 Howard St., San Francisco, CA 94103',
      'description': 'A chance to hear more about Google\'s developer products.',
      'start': {
        'dateTime': '2024-01-28T09:00:00-07:00',
        'timeZone': 'America/Los_Angeles'
      },
      'end': {
        'dateTime': '2024-01-28T17:00:00-07:00',
        'timeZone': 'America/Los_Angeles'
      }
    };
  
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token // access token to google
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
    })
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if (error) {
      alert("Error Logging in to Google Provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  console.log(session);
  return (
    <div className='App'>
      {session ? 
        <>
          <h2>Hey there {session.user.email}</h2>
          <button onClick= {() => createCalenderEvent()}>Create Event</button>
          <button onClick={() => signOut()}> Sign Out</button>
        </>
        :
        <>
          <button onClick={() => googleSignIn()}> Sign In With Google</button>
        </>
      }
    </div>
  );
}

export default App;

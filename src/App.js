import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';

const GPT_KEY = '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';  // secure -> environment variable

function App() {
  const session = useSession(); // tokens
  const supabase = useSupabaseClient(); // talk to  supabase  
  const [syllabusText, setSyllabusText] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [UserInterest, setUserInterest] = useState('');

  useEffect(() => {
    // Update selected options once when options change
    setSelectedOptions(options.filter((option) => option['due date'] !== 'TBD'));
  }, [options]);
  
  const handleTextChange = (event) => {
    setSyllabusText(event.target.value);
  };

  const handleNewCalendarNameChange = (event) => {
    setNewCalendarName(event.target.value);
  };

  const handleUserInterestChange = (event) => {
    setUserInterest(event.target.value);
  };

  const clearAll = () => {
    setSyllabusText('');
    setOptions([]);
    setSelectedOptions([]);
    setNewCalendarName('');
  };

  async function callOpenAIAPI() {
    console.log('Testing GPT API:');
    // Use GPT-3 to analyze the syllabus and extract important dates
    const APIBody = {
      model: 'gpt-4-1106-preview', // You can experiment with different engines
      messages: [{"role": "system", "content": 
                  `You are an educational course syllabus reader that can find important dates in syllabus in various format like schedule table, bullet points, etc.
                  Your job is to find all important events (homework, assignment, quiz, tests, exams, tutorial, project, lab, etc.) that the student might be interested in.
                  ${UserInterest ? `More specifically, the student interest is: ${UserInterest}` : ''}
                  Return them in the form of csv where first column is event name(string) and second column is due date of the event (in the form of yyyy-mm-dd). If date is not there, leave it as TBD. 
                  For example: 
                  event name, due date
                  event1, 2024-01-29
                  event2, TBD`},
                {"role": "user", "content": 
                  `As a student's perspective, find all important events and their due dates from the syllabus below.\n${syllabusText}`
                }],
      max_tokens: 150,  // Customize based on the desired length of the GPT-3 response
      seed: 12345
    }

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GPT_KEY
      },
      body: JSON.stringify(APIBody)
    }).then((data) => {
      if (!data.ok) {
        throw new Error(data.status);
      }
      return data.json();
    }).then((data) => {
      console.log(data);
      console.log(data.choices[0].message.content.trim());
      const parsedOptions = parseCSV(data.choices[0].message.content.trim());
      setOptions(parsedOptions);
    }).catch(error => {
      // Handle errors
      console.error('Fetch error:', error.message);
      if (error.message === '400') {
        alert("The text is too large. Try again with shortened text (i.e remove unnecessary part of the syllabus)");
      } else {
        alert("Error, try again");
      }
    });
  }

  function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const parsedOptions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      const option = {};

      for (let j = 0; j < headers.length; j++) {
        option[headers[j]] = values[j];
      }

      parsedOptions.push(option);
    }

    return parsedOptions;
  }

  const handleCheckboxChange = (event, option) => {
    if (event.target.checked) {
      setSelectedOptions([...selectedOptions, option]);
    } else {
      setSelectedOptions(selectedOptions.filter((selectedOption) => selectedOption !== option));
    }
  };

  function displayOptions() {
    return (
      <div>
        <h3>Select dates to add to your calendar:</h3>
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <input
                type="checkbox"
                id={`checkbox_${index}`}
                checked={selectedOptions.includes(option)}
                onChange={(event) => handleCheckboxChange(event, option)}
                disabled={option['due date'] === 'TBD'}
              />
              <label htmlFor={`checkbox_${index}`}>
                {`${option['event name']}: ${option['due date']}`}
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  async function createCalenderEvent() {
    // Check if there are selected options
    if (selectedOptions.length === 0) {
      console.log('No events selected.');
      alert('Please select events to be added');
      return;
    }

    // Check new calendar name
    if (!newCalendarName) {
      console.log('Please enter a new calendar name.');
      alert('Please enter a new calendar name.');
      return;
    }

    const calendar = {
      summary:newCalendarName
    }

    let newCalendarId;
    // Create new Calendar
    await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token // access token to Google
      },
      body: JSON.stringify(calendar)
    }).then((data) => {
      if (!data.ok) {
        throw new Error(data.status);
      }
      return data.json();
    }).then(result => {
      console.log(result);
      console.log(`Calendar ${calendar.summary} added. ID: ${result.id}`);
      // Now you can use result.id as the newCalendarID
      newCalendarId = result.id;
    }).catch(error => {
      // Handle errors
      console.error('Google Calendar POST Fetch error:', error.message);
      alert("Error, sign out, login and try again");
    });
  

    // Create events from selected options
    const events = selectedOptions.map((option, index) => {
      return {
        'summary': option['event name'],
        'location': '',
        'description': '',
        'start': {
          'date': option['due date'],
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone, // You can customize this
        },
        'end': {
          'date': option['due date'],
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone, // You can customize this
        }
      };
    });
  
    // Add events to the calendar
    for (const event of events) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${newCalendarId}/events`, {
        method: "POST",
        headers: {
          'Authorization': 'Bearer ' + session.provider_token // access token to Google
        },
        body: JSON.stringify(event)
      }).then((data) => {
        if (!data.ok) {
          throw new Error(data.status);
        }
        console.log(`Event ${event.summary} added to the calendar.`);
      }).catch(error => {
        // Handle errors
        console.error('Google Calendar event POST Fetch error:', error.message);
        alert("Error occured inserting events to your calendar, sign out, login and try again");
      });
    }
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

  return (
    <div className='App'>
      {session ? 
        <>
          <h2>Hey there {session.user.email}</h2>
          <textarea
            placeholder="Paste your syllabus here..."
            value={syllabusText}
            onChange={handleTextChange}
          />
          <textarea
            placeholder="Specific types of events you want to create (Tests, Assignments, etc.)"
            value={UserInterest}
            onChange={handleUserInterestChange}
          />
          <textarea
            placeholder="Paste your Calendar name here..."
            value={newCalendarName}
            onChange={handleNewCalendarNameChange}
          />
          <button onClick={callOpenAIAPI}>Generate Response</button>
          <button onClick= {() => createCalenderEvent()}>Create Event</button>
          <button onClick={clearAll}>Clear All</button>
          <button onClick={() => signOut()}> Sign Out</button>
          {options.length > 0 && displayOptions()}
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

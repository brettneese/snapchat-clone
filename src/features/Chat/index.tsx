import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { getMessages, postMessage, switchThread } from './duck';
import { dummyMessages } from './data';
import { hideDrawer } from 'AppShell/duck';
import { HideDrawer } from 'AppShell/types';
import { Session } from 'features/User/types';
import { GetMessages, PostMessage, SwitchThread, Message } from 'features/Chat/types';
import { randomArrayVal } from 'utils/array';
import { playSound } from 'utils/audio';
import Notification from 'common/Notification';
import Input from 'common/Input';
import Avatar from 'common/Avatar';
import PillButtons from 'common/PillButtons';
import Button from 'common/Button';
import './index.scss';

interface Props {
  session: Session;
  user: string;
  messages: Message[];
  hideDrawer: HideDrawer;
  getMessages: GetMessages;
  postMessage: PostMessage;
  switchThread: SwitchThread;
}

const Chat: React.FC<Props> = ({
  session,
  user,
  messages,
  hideDrawer,
  getMessages,
  postMessage,
  switchThread
}) => {
  const messageContainer = useRef<HTMLElement>(null);
  const audioElem = useRef<HTMLAudioElement>(null);

  const [message, setMessage] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const [messageReceived, setMessageReceived] = useState<boolean>(false);

  // New message from other user
  useEffect(() => {
    setTimeout(() => {
      setMessageReceived(true);
      if (audioElem.current) playSound('newSystemMessage', audioElem.current);
      setTimeout(() => setMessageReceived(false), 3000);
    }, 3000);
  }, []);

  useLayoutEffect(() => {
    // Scroll to bottom of container on load and each time a new message is posted
    if (messageContainer.current)
      messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
  }, [messages]);

  const botResponse = useCallback(() => {
    // Randomize the response and typing times to make the bot seem a little more "realistic"
    const responseTimes = [500, 700, 900];
    const typeTimes = [1200, 1400, 1600];
    setTimeout(() => setTyping(true), randomArrayVal(responseTimes));
    setTimeout(() => {
      setTyping(false);
      postMessage(user, user, randomArrayVal(dummyMessages));
      if (audioElem.current) playSound('newAppMessage', audioElem.current);
    }, randomArrayVal(typeTimes));
  }, [postMessage, user]);

  useEffect(() => {
    getMessages(user);
    botResponse(); // New message from current user
  }, [user, getMessages, botResponse]);

  const submitMessage = () => {
    postMessage(user, session.username, message);
    setMessage('');
    botResponse();
  };

  return (
    <main className="chat">
      <Notification
        sender="Tom"
        time="now"
        show={messageReceived}
        onClick={() => {
          setMessageReceived(false);
          switchThread('tom');
        }}
      />

      <header>
        <Avatar src="./images/bitmoji.png" />
        <h2>{user}</h2>
        <div className="right">
          <PillButtons icons={['faPhoneAlt', 'faVideo']} />
          <Button icon="faAngleRight" onclick={() => hideDrawer('chat')} />
        </div>
      </header>

      <section ref={messageContainer} className="messages">
        {messages[user]?.map(({ author, message, time }, index) => (
          <article key={time + index} className="message">
            <header>{author}</header>
            <blockquote>{message}</blockquote>
          </article>
        ))}
      </section>
      <footer>
        <div className={classNames({ typing })}>
          <Avatar src="./images/bitmoji.png" />
        </div>
        <div className="inner-content">
          <Button icon="faCamera" />
          <Input
            placeholder="Send a chat"
            rightIcon="faMicrophone"
            onChange={(e) => setMessage(e.currentTarget.value)}
            onEnter={submitMessage}
            onBlur={submitMessage}
            value={message}
          />
          <div className="right">
            <Button icon="faSmileWink" />
            <Button icon="faSmileWink" />
            <Button icon="faRocket" />
          </div>
        </div>
      </footer>
      <audio ref={audioElem} className="app-sound"></audio>
    </main>
  );
};

const mapStateToProps = ({ user, chat }) => ({
  session: user.session,
  user: chat.activeThread,
  messages: chat
});

const mapDispatchToProps = (dispatch) => ({
  hideDrawer: (component) => dispatch(hideDrawer(component)),
  getMessages: (user) => dispatch(getMessages(user)),
  postMessage: (user, author, message) => dispatch(postMessage(user, author, message)),
  switchThread: (user) => dispatch(switchThread(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(Chat);

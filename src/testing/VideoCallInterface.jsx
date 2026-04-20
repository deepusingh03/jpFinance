import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings, 
  Users, Monitor, MoreVertical, Copy, Volume2, VolumeX,
  UserPlus, MessageSquare, Maximize2, Minimize2
} from 'lucide-react';

// Mock WebRTC service simulation
const simulateWebRTC = {
  connect: () => Promise.resolve({ connectionId: 'conn_' + Date.now() }),
  disconnect: () => Promise.resolve(),
  shareScreen: () => Promise.resolve(),
  stopScreenShare: () => Promise.resolve(),
  addParticipant: (name) => Promise.resolve({ id: Date.now(), name })
};

export default function VideoCallInterface() {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState('');
  const [notification, setNotification] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'System', message: 'Welcome to ConnectStream!', time: '10:00 AM' },
    { id: 2, sender: 'Sarah Chen', message: 'Hello everyone!', time: '10:01 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const chatContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const callTimerRef = useRef(null);

  // Generate random call ID
  useEffect(() => {
    setCallId('CS-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  }, []);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        showNotification('Unable to access camera/microphone. Please check permissions.');
      }
    };

    initializeMedia();

    return () => {
      cleanupMedia();
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration(0);
    }

    return () => clearInterval(callTimerRef.current);
  }, [isCallActive]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        showNotification(videoTrack.enabled ? 'Video turned on' : 'Video turned off');
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        showNotification(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
      }
    }
  };

  const toggleCall = async () => {
    if (!isCallActive) {
      try {
        await simulateWebRTC.connect();
        setIsCallActive(true);
        
        // Simulate participants joining
        setTimeout(() => {
          const newParticipants = [
            { id: 1, name: 'Sarah Chen', status: 'speaking', isVideoOn: true, isAudioOn: true },
            { id: 2, name: 'Michael Ross', status: 'connected', isVideoOn: false, isAudioOn: true },
            { id: 3, name: 'Alex Johnson', status: 'connected', isVideoOn: true, isAudioOn: false },
            { id: 4, name: 'Emma Wilson', status: 'speaking', isVideoOn: true, isAudioOn: true },
          ];
          setParticipants(newParticipants);
          showNotification('Call started. Participants joined.');
        }, 1000);
      } catch (err) {
        showNotification('Failed to start call' + err);
      }
    } else {
      await simulateWebRTC.disconnect();
      setIsCallActive(false);
      setParticipants([]);
      setIsScreenSharing(false);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      showNotification('Call ended');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor"
          },
          audio: false
        });
        
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
        
        showNotification('Screen sharing started');
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        showNotification('Screen sharing stopped');
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
      showNotification('Screen sharing cancelled');
    }
  };

  const inviteParticipant = () => {
    const inviteLink = `${window.location.origin}/join/${callId}`;
    navigator.clipboard.writeText(inviteLink);
    showNotification('Invite link copied to clipboard!');
  };

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        sender: 'You',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleParticipantAudio = (id) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, isAudioOn: !p.isAudioOn } : p
    ));
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
    showNotification('Participant removed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        
        * {
          font-family: 'Outfit', sans-serif;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .speaking-indicator {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.5);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .control-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        video {
          object-fit: cover;
        }

        .local-video {
          transform: scaleX(-1);
        }

        .grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
      `}</style>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="px-4 py-3 rounded-lg glass-effect border border-white/20">
            <p className="text-white text-sm">{notification}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass-effect border-b border-white/10 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">ConnectStream</h1>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-slate-400 font-mono">Call ID: {callId}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(callId);
                    showNotification('Call ID copied!');
                  }}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isCallActive && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass-effect">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-slow"></div>
                  <span className="text-sm text-slate-300 font-mono">{formatTime(callDuration)}</span>
                </div>
                <span className="text-sm text-slate-400">•</span>
                <span className="text-sm text-slate-300">{participants.length + 1} online</span>
              </div>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg glass-effect hover:bg-white/10 transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-slate-300" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-300" />
              )}
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg glass-effect hover:bg-white/10 transition-all"
            >
              <Settings className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-6 max-w-7xl mx-auto w-full">
        {/* Video Grid */}
        <div className="flex-1 flex flex-col">
          {isScreenSharing ? (
            <div className="relative h-full rounded-2xl overflow-hidden glass-effect border border-white/10 animate-fadeIn">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="w-full h-full"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg glass-effect border border-green-500/50">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Sharing Screen</span>
                </div>
              </div>
            </div>
          ) : isCallActive && participants.length > 0 ? (
            <div className="grid-view h-full">
              {/* Local Video */}
              <div className="relative rounded-xl overflow-hidden glass-effect border border-white/10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 local-video object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">You</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded glass-effect">
                  <span className="text-xs text-white font-medium">You (Host)</span>
                </div>
                {!isAudioOn && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Participant Videos */}
              {participants.map((participant) => (
                <div key={participant.id} className="relative rounded-xl overflow-hidden glass-effect border border-white/10">
                  {participant.isVideoOn ? (
                    <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        participant.status === 'speaking' ? 'speaking-indicator' : ''
                      }`}>
                        <span className="text-white text-2xl font-semibold">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ${
                        participant.status === 'speaking' ? 'speaking-indicator' : ''
                      }`}>
                        <span className="text-white text-2xl font-semibold">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded glass-effect">
                    <span className="text-xs text-white font-medium">{participant.name}</span>
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {!participant.isAudioOn && (
                      <div className="p-1.5 rounded-full bg-red-500/80">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <button
                      onClick={() => removeParticipant(participant.id)}
                      className="p-1.5 rounded-full bg-slate-700/80 hover:bg-slate-600/80"
                    >
                      <span className="text-white text-xs">×</span>
                    </button>
                  </div>
                  {participant.status === 'speaking' && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-green-500/20">
                      <span className="text-xs text-green-400">Speaking</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative h-full rounded-2xl overflow-hidden glass-effect border border-white/10 animate-fadeIn flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                  <Video className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-400 text-xl mb-2">Ready to connect</p>
                <p className="text-slate-500 text-sm">Start a call and invite participants</p>
                <button
                  onClick={inviteParticipant}
                  className="mt-4 px-4 py-2 rounded-lg glass-effect hover:bg-white/10 flex items-center space-x-2 mx-auto"
                >
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">Copy Invite Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(showParticipants || showChat) && (
          <div className="w-80 flex flex-col gap-4">
            {/* Participants Panel */}
            {showParticipants && isCallActive && (
              <div className="glass-effect rounded-2xl border border-white/10 p-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Participants ({participants.length + 1})</span>
                  </h3>
                  <button
                    onClick={() => setShowParticipants(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <span className="text-white">×</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Current user */}
                  <div className="p-3 rounded-lg glass-effect">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">You</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">You (Host)</p>
                        <p className="text-slate-400 text-xs">Connected</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleAudio}
                          className={`p-1.5 rounded ${isAudioOn ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                        >
                          {isAudioOn ? (
                            <Mic className="w-3 h-3 text-green-400" />
                          ) : (
                            <MicOff className="w-3 h-3 text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={toggleVideo}
                          className={`p-1.5 rounded ${isVideoOn ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                        >
                          {isVideoOn ? (
                            <Video className="w-3 h-3 text-green-400" />
                          ) : (
                            <VideoOff className="w-3 h-3 text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Other participants */}
                  {participants.map((participant) => (
                    <div key={participant.id} className="p-3 rounded-lg glass-effect">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          participant.status === 'speaking' ? 'speaking-indicator' : ''
                        }`}>
                          <span className="text-white text-sm font-semibold">
                            {participant.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{participant.name}</p>
                          <p className="text-slate-400 text-xs">
                            {participant.status === 'speaking' ? 'Speaking...' : 'Connected'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleParticipantAudio(participant.id)}
                            className={`p-1.5 rounded ${participant.isAudioOn ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                          >
                            {participant.isAudioOn ? (
                              <Volume2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <VolumeX className="w-3 h-3 text-red-400" />
                            )}
                          </button>
                          <button
                            onClick={() => removeParticipant(participant.id)}
                            className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30"
                          >
                            <span className="text-red-400 text-xs">×</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {showChat && isCallActive && (
              <div className="glass-effect rounded-2xl border border-white/10 p-4 animate-fadeIn flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat</span>
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <span className="text-white">×</span>
                  </button>
                </div>
                
                <div 
                  ref={chatContainerRef}
                  className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-64"
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${msg.sender === 'You' ? 'bg-blue-500/10 border border-blue-500/20' : 'glass-effect'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${msg.sender === 'You' ? 'text-blue-300' : 'text-white'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-xs text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-200 text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-lg glass-effect border border-white/10 text-white placeholder-slate-400"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <span className="text-white text-sm">Send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="glass-effect border-t border-white/10 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`control-button p-3 rounded-lg flex items-center space-x-2 ${
                  showParticipants ? 'bg-blue-500/20 text-blue-300' : 'glass-effect text-slate-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">Participants</span>
              </button>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`control-button p-3 rounded-lg flex items-center space-x-2 ${
                  showChat ? 'bg-blue-500/20 text-blue-300' : 'glass-effect text-slate-300'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">Chat</span>
              </button>
              
              <button
                onClick={inviteParticipant}
                className="control-button p-3 rounded-lg glass-effect text-slate-300 hover:bg-white/10 flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span className="text-sm">Invite</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`control-button w-14 h-14 rounded-full flex items-center justify-center ${
                  isAudioOn
                    ? 'glass-effect hover:bg-white/10'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isAudioOn ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`control-button w-14 h-14 rounded-full flex items-center justify-center ${
                  isVideoOn
                    ? 'glass-effect hover:bg-white/10'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isVideoOn ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoOn ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`control-button w-14 h-14 rounded-full flex items-center justify-center ${
                  isScreenSharing
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'glass-effect hover:bg-white/10'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <Monitor className="w-6 h-6 text-white" />
              </button>

              {/* Call Toggle */}
              <button
                onClick={toggleCall}
                className={`control-button w-16 h-16 rounded-full flex items-center justify-center ${
                  isCallActive
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                } shadow-lg`}
                title={isCallActive ? 'End call' : 'Start call'}
              >
                {isCallActive ? (
                  <PhoneOff className="w-7 h-7 text-white" />
                ) : (
                  <Phone className="w-7 h-7 text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              {isCallActive 
                ? `Call in progress • ${formatTime(callDuration)} • ${participants.length + 1} participants`
                : 'Ready to connect • Click the green button to start'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="glass-effect rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <span className="text-white text-xl">&times;</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Camera
                </label>
                <select className="w-full px-4 py-2 rounded-lg glass-effect border border-white/10 text-white bg-transparent">
                  <option>Default Camera</option>
                  <option>Camera 2</option>
                  <option>Camera 3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Microphone
                </label>
                <select className="w-full px-4 py-2 rounded-lg glass-effect border border-white/10 text-white bg-transparent">
                  <option>Default Microphone</option>
                  <option>Microphone 2</option>
                  <option>Microphone 3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Speaker
                </label>
                <select className="w-full px-4 py-2 rounded-lg glass-effect border border-white/10 text-white bg-transparent">
                  <option>Default Speaker</option>
                  <option>Speaker 2</option>
                  <option>Speaker 3</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Noise Cancellation</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg glass-effect text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    showNotification('Settings saved');
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
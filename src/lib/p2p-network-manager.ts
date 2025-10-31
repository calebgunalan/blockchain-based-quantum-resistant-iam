/**
 * P2P Network Manager using WebRTC
 * Enables browser-to-browser blockchain synchronization
 */

import { supabase } from '@/integrations/supabase/client';

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connected: boolean;
}

export interface NetworkMessage {
  type: 'block' | 'transaction' | 'sync_request' | 'sync_response' | 'peer_list';
  data: any;
  timestamp: number;
  senderId: string;
}

export class P2PNetworkManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localPeerId: string;
  private signalingChannel: any = null;
  private onMessageCallback?: (message: NetworkMessage, peerId: string) => void;

  constructor(localPeerId: string) {
    this.localPeerId = localPeerId;
  }

  /**
   * Initialize P2P network with Supabase Realtime as signaling server
   */
  async initialize(onMessage?: (message: NetworkMessage, peerId: string) => void) {
    this.onMessageCallback = onMessage;

    // Set up Supabase Realtime as signaling server
    this.signalingChannel = supabase
      .channel('p2p-signaling')
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        await this.handleSignalingMessage(payload);
      })
      .on('broadcast', { event: 'peer_join' }, ({ payload }) => {
        console.log('Peer joined:', payload.peerId);
        this.connectToPeer(payload.peerId);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          await this.signalingChannel.send({
            type: 'broadcast',
            event: 'peer_join',
            payload: { peerId: this.localPeerId }
          });
        }
      });

    console.log(`P2P Network initialized for peer: ${this.localPeerId}`);
  }

  /**
   * Connect to a peer using WebRTC
   */
  async connectToPeer(peerId: string) {
    if (this.peers.has(peerId) || peerId === this.localPeerId) {
      return;
    }

    console.log(`Connecting to peer: ${peerId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    const dataChannel = peerConnection.createDataChannel('blockchain');
    this.setupDataChannel(dataChannel, peerId);

    const peer: PeerConnection = {
      peerId,
      connection: peerConnection,
      dataChannel,
      connected: false
    };

    this.peers.set(peerId, peer);

    // Create and send offer
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice_candidate',
          candidate: event.candidate,
          to: peerId,
          from: this.localPeerId
        });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      offer,
      to: peerId,
      from: this.localPeerId
    });
  }

  /**
   * Handle signaling messages from Supabase Realtime
   */
  private async handleSignalingMessage(payload: any) {
    if (payload.to !== this.localPeerId) return;

    console.log('Received signal:', payload.type);

    switch (payload.type) {
      case 'offer':
        await this.handleOffer(payload);
        break;
      case 'answer':
        await this.handleAnswer(payload);
        break;
      case 'ice_candidate':
        await this.handleIceCandidate(payload);
        break;
    }
  }

  /**
   * Handle incoming WebRTC offer
   */
  private async handleOffer(payload: any) {
    const { from, offer } = payload;

    if (this.peers.has(from)) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, from);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice_candidate',
          candidate: event.candidate,
          to: from,
          from: this.localPeerId
        });
      }
    };

    const peer: PeerConnection = {
      peerId: from,
      connection: peerConnection,
      dataChannel: null,
      connected: false
    };

    this.peers.set(from, peer);

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      answer,
      to: from,
      from: this.localPeerId
    });
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(payload: any) {
    const { from, answer } = payload;
    const peer = this.peers.get(from);

    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(payload: any) {
    const { from, candidate } = payload;
    const peer = this.peers.get(from);

    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      console.log(`Data channel opened with peer: ${peerId}`);
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.connected = true;
        peer.dataChannel = channel;
      }
    };

    channel.onmessage = (event) => {
      try {
        const message: NetworkMessage = JSON.parse(event.data);
        console.log(`Received message from ${peerId}:`, message.type);
        this.onMessageCallback?.(message, peerId);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    channel.onclose = () => {
      console.log(`Data channel closed with peer: ${peerId}`);
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.connected = false;
      }
    };
  }

  /**
   * Send signal through Supabase Realtime
   */
  private async sendSignal(payload: any) {
    await this.signalingChannel.send({
      type: 'broadcast',
      event: 'signal',
      payload
    });
  }

  /**
   * Broadcast message to all connected peers
   */
  async broadcast(message: Omit<NetworkMessage, 'timestamp' | 'senderId'>) {
    const networkMessage: NetworkMessage = {
      ...message,
      timestamp: Date.now(),
      senderId: this.localPeerId
    };

    const messageStr = JSON.stringify(networkMessage);
    let sent = 0;

    for (const peer of this.peers.values()) {
      if (peer.connected && peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(messageStr);
        sent++;
      }
    }

    console.log(`Broadcast message to ${sent} peers`);
    return sent;
  }

  /**
   * Send message to specific peer
   */
  async sendToPeer(peerId: string, message: Omit<NetworkMessage, 'timestamp' | 'senderId'>) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connected || peer.dataChannel?.readyState !== 'open') {
      throw new Error(`Peer ${peerId} not connected`);
    }

    const networkMessage: NetworkMessage = {
      ...message,
      timestamp: Date.now(),
      senderId: this.localPeerId
    };

    peer.dataChannel.send(JSON.stringify(networkMessage));
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.values())
      .filter(p => p.connected)
      .map(p => p.peerId);
  }

  /**
   * Disconnect from all peers
   */
  async disconnect() {
    for (const peer of this.peers.values()) {
      peer.dataChannel?.close();
      peer.connection.close();
    }
    this.peers.clear();

    if (this.signalingChannel) {
      await supabase.removeChannel(this.signalingChannel);
      this.signalingChannel = null;
    }

    console.log('P2P network disconnected');
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    const total = this.peers.size;
    const connected = this.getConnectedPeers().length;

    return {
      totalPeers: total,
      connectedPeers: connected,
      localPeerId: this.localPeerId
    };
  }
}

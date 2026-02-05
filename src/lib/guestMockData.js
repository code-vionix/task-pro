
// High-end Dummy Data for Guest Observation Mode

export const MOCK_TASKS_SETS = [
    [
        { id: 'gt-1', title: 'Deep Learning Model Training', description: 'Optimize hyperparameters for neural net.', status: 'IN_PROGRESS', type: 'PRACTICE', duration: 3600, createdAt: new Date().toISOString() },
        { id: 'gt-2', title: 'Blockchain Security Audit', description: 'Review smart contracts for vulnerabilities.', status: 'PENDING', type: 'EXAM', duration: 7200, createdAt: new Date().toISOString() },
        { id: 'gt-3', title: 'Quantum Encryption Test', description: 'Validate post-quantum algorithms.', status: 'COMPLETED', type: 'PRACTICE', duration: 1800, createdAt: new Date().toISOString() },
    ],
    [
        { id: 'gt-4', title: 'Satellite Uplink Calibration', description: 'Align phased array antenna with orbital data.', status: 'IN_PROGRESS', type: 'EXAM', duration: 5400, createdAt: new Date().toISOString() },
        { id: 'gt-5', title: 'Neural Interface Mapping', description: 'Sync biometric feedback with cortex signals.', status: 'PENDING', type: 'PRACTICE', duration: 900, createdAt: new Date().toISOString() },
        { id: 'gt-6', title: 'Cybernetic Limb Firmware', description: 'Flash v4.2 update prosthetic controller.', status: 'COMPLETED', type: 'PRACTICE', duration: 1200, createdAt: new Date().toISOString() },
    ],
    [
        { id: 'gt-7', title: 'Dark Web Node Investigation', description: 'Track suspicious activity on decentralized relays.', status: 'IN_PROGRESS', type: 'EXAM', duration: 10800, createdAt: new Date().toISOString() },
        { id: 'gt-8', title: 'Bio-Hacking Lab Security', description: 'Ensure air-gap for genetic sequencing server.', status: 'PENDING', type: 'PRACTICE', duration: 3600, createdAt: new Date().toISOString() },
        { id: 'gt-9', title: 'AI Ethics Parameter Sweep', description: 'Run simulations on trolley problem edge cases.', status: 'COMPLETED', type: 'PRACTICE', duration: 300, createdAt: new Date().toISOString() },
    ]
];

export const MOCK_POSTS_SETS = [
    [
        {
            id: 'gp-1',
            content: "Just deployed the new decentralized identity protocol. The latency is almost non-existent! Web3 is finally ready for the masses. #Decentralization #Web3",
            user: { id: 'gu-1', email: 'tech_lead@matrix.io', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
            imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
            createdAt: new Date().toISOString(),
            _count: { comments: 42, shares: 12 },
            reactions: [{ type: 'LIKE', userId: 'r-1', user: { email: 'dev_alpha' } }, { type: 'LOVE', userId: 'r-2', user: { email: 'eth_queen' } }],
            comments: []
        },
        {
            id: 'gp-2',
            content: "The view from the edge computing node in Iceland is incredible. Cooling is free when it's -20 degrees outside! ❄️💻",
            user: { id: 'gu-2', email: 'infra_wizard@cloud.is', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
            createdAt: new Date().toISOString(),
            _count: { comments: 5, shares: 2 },
            reactions: [{ type: 'LIKE', userId: 'r-3', user: { email: 'server_guy' } }],
            comments: []
        }
    ],
    [
        {
            id: 'gp-3',
            content: "Is anyone else experiencing weird anomalies in the simulation today? Or is it just my neural link acting up? 👁️",
            user: { id: 'gu-3', email: 'glitch_hunter@void.net', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
            createdAt: new Date().toISOString(),
            _count: { comments: 89, shares: 34 },
            reactions: [{ type: 'DISLIKE', userId: 'r-4', user: { email: 'agent_smith' } }],
            comments: []
        },
        {
            id: 'gp-4',
            content: "Synthesizing new biotech assets in the digital lab. The future of medicine is programmable DNA.",
            user: { id: 'gu-4', email: 'bio_hacker@life.ext', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
            imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9d39d998e?w=800&q=80',
            createdAt: new Date().toISOString(),
            _count: { comments: 12, shares: 8 },
            reactions: [{ type: 'LOVE', userId: 'r-5', user: { email: 'med_student' } }],
            comments: []
        }
    ]
];

export const MOCK_CHATS_SETS = [
    [
        { id: 'gc-1', email: 'sentinel@system.ai', lastMessage: 'Alert: Unauthorized login attempt detected in Sector 7G.', lastTimestamp: new Date().toISOString(), unreadCount: 1, isOnline: true },
        { id: 'gc-2', email: 'nova@space.corp', lastMessage: 'The moon base orbit is stabilizing. Send the credentials.', lastTimestamp: new Date().toISOString(), unreadCount: 0, isOnline: false }
    ],
    [
        { id: 'gc-3', email: 'cipher@dark.web', lastMessage: 'The encrypted key is hidden in the genesis block.', lastTimestamp: new Date().toISOString(), unreadCount: 0, isOnline: true },
        { id: 'gc-4', email: 'oracle@future.io', lastMessage: 'I have seen the logs. You are the one we were waiting for.', lastTimestamp: new Date().toISOString(), unreadCount: 3, isOnline: true }
    ]
];

export const getSeededSet = (sets, seed) => {
    return sets[seed % sets.length];
};

export const getRandomSet = (sets) => {
    return sets[Math.floor(Math.random() * sets.length)];
};

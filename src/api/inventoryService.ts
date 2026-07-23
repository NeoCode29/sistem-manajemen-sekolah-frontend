// Mocking Inventory service using LocalStorage since backend doesn't have it yet

export interface Room {
  id: string;
  name: string;
  code?: string;
  capacity?: number;
  building?: string;
  floor?: string;
  description?: string;
}

export interface HardwareItem {
  id: string;
  code: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition: string;
  status: string;
  roomId?: string;
  room?: Room;
}

const getStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// ==========================
// ROOMS
// ==========================
export const getRooms = async (params?: Record<string, any>): Promise<Room[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let rooms = getStorage('mock_rooms');
  if (params?.search) {
    rooms = rooms.filter((r: Room) => 
      r.name.toLowerCase().includes(params.search.toLowerCase()) || 
      (r.code && r.code.toLowerCase().includes(params.search.toLowerCase()))
    );
  }
  return rooms;
};

export const createRoom = async (data: Partial<Room>): Promise<Room> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const rooms = getStorage('mock_rooms');
  const newRoom = { ...data, id: generateId() };
  rooms.push(newRoom);
  setStorage('mock_rooms', rooms);
  return newRoom as Room;
};

export const updateRoom = async (id: string, data: Partial<Room>): Promise<Room> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const rooms = getStorage('mock_rooms');
  const index = rooms.findIndex((r: Room) => r.id === id);
  if (index !== -1) {
    rooms[index] = { ...rooms[index], ...data };
    setStorage('mock_rooms', rooms);
    return rooms[index];
  }
  throw new Error('Room not found');
};

export const deleteRoom = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let rooms = getStorage('mock_rooms');
  rooms = rooms.filter((r: Room) => r.id !== id);
  setStorage('mock_rooms', rooms);
};

// ==========================
// HARDWARE ITEMS
// ==========================
export const getItems = async (params?: Record<string, any>): Promise<HardwareItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let items = getStorage('mock_items');
  const rooms = getStorage('mock_rooms');
  
  // populate room
  items = items.map((i: HardwareItem) => {
    if (i.roomId) {
      i.room = rooms.find((r: Room) => r.id === i.roomId);
    }
    return i;
  });

  if (params?.search) {
    items = items.filter((i: HardwareItem) => 
      i.name.toLowerCase().includes(params.search.toLowerCase()) || 
      i.code.toLowerCase().includes(params.search.toLowerCase())
    );
  }
  if (params?.roomId) {
    items = items.filter((i: HardwareItem) => i.roomId === params.roomId);
  }
  if (params?.status) {
    items = items.filter((i: HardwareItem) => i.status === params.status);
  }
  
  return items;
};

export const createItem = async (data: Partial<HardwareItem>): Promise<HardwareItem> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const items = getStorage('mock_items');
  const newItem = { ...data, id: generateId() };
  items.push(newItem);
  setStorage('mock_items', items);
  return newItem as HardwareItem;
};

export const updateItem = async (id: string, data: Partial<HardwareItem>): Promise<HardwareItem> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const items = getStorage('mock_items');
  const index = items.findIndex((i: HardwareItem) => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data };
    setStorage('mock_items', items);
    return items[index];
  }
  throw new Error('Item not found');
};

export const deleteItem = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let items = getStorage('mock_items');
  items = items.filter((i: HardwareItem) => i.id !== id);
  setStorage('mock_items', items);
};

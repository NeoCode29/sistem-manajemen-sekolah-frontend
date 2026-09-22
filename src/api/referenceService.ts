import api from './axios';

export interface Province {
  code: string;
  name: string;
}

export interface Regency {
  code: string;
  provinceCode: string;
  name: string;
}

export interface District {
  code: string;
  regencyCode: string;
  name: string;
}

export interface Village {
  code: string;
  districtCode: string;
  name: string;
}

export interface Occupation {
  id: string;
  category?: string;
  name: string;
}

export const getProvinces = async (search?: string): Promise<Province[]> => {
  const response = await api.get('/references/provinces', { params: { search } });
  return response.data;
};

export const getRegencies = async (provinceCode?: string, search?: string): Promise<Regency[]> => {
  const response = await api.get('/references/regencies', { params: { provinceCode, search } });
  return response.data;
};

export const getDistricts = async (regencyCode?: string, search?: string): Promise<District[]> => {
  const response = await api.get('/references/districts', { params: { regencyCode, search } });
  return response.data;
};

export const getVillages = async (districtCode?: string, search?: string): Promise<Village[]> => {
  const response = await api.get('/references/villages', { params: { districtCode, search } });
  return response.data;
};

export const getOccupations = async (search?: string, category?: string): Promise<Occupation[]> => {
  const response = await api.get('/references/occupations', { params: { search, category } });
  return response.data;
};

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { genreDto, genreCreationDto } from './genres.model';

@Injectable({
  providedIn: 'root'
})
export class GenresService {

  constructor(private http: HttpClient) { }

  private apiUrl = environment.apiUrl + '/genres'

  getAll(): Observable<genreDto[]> {
    return this.http.get<genreDto[]> (this.apiUrl);
  }

  getById(id: number): Observable<genreDto> {
    return this.http.get<genreDto>(`${this.apiUrl}/${id}`);
  }

  create(genre: genreCreationDto) {
    return this.http.post(this.apiUrl, genre);
  }

  edit(id: number, genre: genreCreationDto) {
    return this.http.put(`${this.apiUrl}/${id}`, genre);
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

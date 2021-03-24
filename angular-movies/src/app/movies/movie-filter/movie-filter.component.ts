import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { GenresService } from './../../genres/genres.service';
import { movieDto } from './../movies.model';
import { genreDto } from './../../genres/genres.model';
import { MoviesService } from './../movies.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-movie-filter',
  templateUrl: './movie-filter.component.html',
  styleUrls: ['./movie-filter.component.css']
})
export class MovieFilterComponent implements OnInit {

  form: FormGroup;
  genres: genreDto[];
  movies: movieDto[];
  currentPage = 1;
  recordsPerPage = 10;
  initialFormValues: any;
  totalAmountOfRecords;

  constructor(
    private formBuilder: FormBuilder, 
    private moviesService: MoviesService, 
    private genresService: GenresService, 
    private location: Location,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      title: '',
      genreId: 0,
      upcomingReleases: false,
      inTheaters: false
    });

    this.initialFormValues = this.form.value;
    this.readParametersFromURL();

    this.genresService.getAll().subscribe(genres => {
      this.genres = genres;

      this.filterMovies(this.form.value);

      this.form.valueChanges.subscribe(values => {
        this.filterMovies(values);
        this.writeParametersInURL();
      })
    })
  }

  filterMovies(values: any) {
    values.page = this.currentPage;
    values.recordsPerPage = this.recordsPerPage;
    this.moviesService.filter(values).subscribe((response: HttpResponse<movieDto[]>) => {
      this.movies = response.body;
      this.totalAmountOfRecords = response.headers.get("totalAmountOfRecords")
    })
  }

  private readParametersFromURL() {
    this.activatedRoute.queryParams.subscribe(params => {
      var obj: any = {};

      if (params.title) {
        obj.title = params.title;
      }

      if (params.genreId) {
        obj.genreId = Number(params.genreId);
      }

      if (params.upcomingReleases) {
        obj.upcomingReleases = params.upcomingReleases
      }

      if (params.inTheaters) {
        obj.inTheaters = params.inTheaters;
      }

      if (params.page) {
        this.currentPage = params.page;
      }

      if (params.recordsPerPage) {
        this.recordsPerPage = params.recordsPerPage;
      }

      this.form.patchValue(obj);
    })
  }

  private writeParametersInURL() {
    const queryStrings = [];

    const formValues = this.form.value;

    if (formValues.title) {
      queryStrings.push(`title=${formValues.title}`);
    }

    if (formValues.genreId != '0') {
      queryStrings.push(`genreId=${formValues.genreId}`);
    }

    if (formValues.upcomingReleases) {
      queryStrings.push(`upcomingReleases=${formValues.upcomingReleases}`);
    }

    if (formValues.inTheaters) {
      queryStrings.push(`inTheaters=${formValues.inTheaters}`)
    }

    queryStrings.push(`page=${this.currentPage}`);
    queryStrings.push(`recordsPerPage=${this.recordsPerPage}`);

    this.location.replaceState('movies/filter', queryStrings.join('&'));
  }

  paginatorUpdate(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.recordsPerPage = event.pageSize;
    this.writeParametersInURL();
    this.filterMovies(this.form.value);
  }

  cleanForm() {
    this.form.patchValue(this.initialFormValues);
  }

  onDelete() {
    this.filterMovies(this.form.value);
  }

}

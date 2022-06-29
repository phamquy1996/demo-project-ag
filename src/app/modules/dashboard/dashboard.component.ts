import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { PersonService } from './../../core/services/person.service';
import { AuthService } from './../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})

export class DashboardComponent {
  displayedColumns: string[] = ['picture', 'name', 'gender', 'email', 'phone'];
  search = '';
  isCheckViewTable = false;
  username: string | null = '';
  dataSource: any;

  constructor(
    private personService: PersonService,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
  ) {
    this.getPersionList();
    this.getUserName();
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  getPersionList() {
    this.spinner.show();
    let self = this;
    this.personService.getData().subscribe(
      (res: any) => {
        if (res) {
          self.dataSource = new MatTableDataSource<any>(res);
          self.dataSource.paginator = self.paginator;
          self.dataSource.sort = self.sort;
          self.dataSource.sortingDataAccessor = (item: any, property: string) => {
            switch (property) {
              case 'name':
                return item.name.first + item.name.last;
              default:
                return item[property];
            }
          };
          self.spinner.hide();
        }
      },
      (err: any) => {
        console.log(err);
        self.spinner.hide();
      }
    );
  }

  getUserName() {
    this.username = this.authService.getUserName();
  }

  changeView(e: any, key: string) {
    if (key === 'table') {
      this.isCheckViewTable = false;
    } else {
      this.isCheckViewTable = true;
    }
  }

  logout(){
    this.authService.logout();
  }
}

import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { ResultInfo, ResultsService } from '../../results.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import * as d3 from 'd3';

export class GraphRenderer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private pointSize: number;
  private axisScale: number;
  private R: number;
  private points: ResultInfo[];

  private width!: number;
  private height!: number;
  private screenCenterX!: number;
  private screenCenterY!: number;

  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private xScaleReversed!: d3.ScaleLinear<number, number>;
  private yScaleReversed!: d3.ScaleLinear<number, number>;
  private shapeXScale!: d3.ScaleLinear<number, number>;
  private shapeYScale!: d3.ScaleLinear<number, number>;

  private resizeObserver!: ResizeObserver;
  private submitResult: (x: number, y: number) => void;

  constructor(
    containerId: string,
    R: number,
    points: ResultInfo[],
    submitResult: (x: number, y: number) => void
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    this.container = container;
    this.svg = d3.select(`#${containerId}`) as unknown as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;
    this.pointSize = 5;
    this.axisScale = 5;
    this.R = R;
    this.points = points;
    this.submitResult = submitResult;

    this.initDimensions();
    this.initScales();
    this.setupResizeObserver();
    this.setupClickHandler();
    this.redraw();
  }

  private initDimensions(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.screenCenterX = this.width / 2;
    this.screenCenterY = this.height / 2;
  }

  private initScales(): void {
    this.xScale = d3
      .scaleLinear()
      .domain([-this.axisScale, this.axisScale])
      .range([0, this.width]);

    this.yScale = d3
      .scaleLinear()
      .domain([-this.axisScale, this.axisScale])
      .range([this.height, 0]);

    this.xScaleReversed = d3
      .scaleLinear()
      .domain([0, this.width])
      .range([-this.axisScale, this.axisScale]);

    this.yScaleReversed = d3
      .scaleLinear()
      .domain([this.height, 0])
      .range([-this.axisScale, this.axisScale]);

    this.updateShapeScales();
  }

  private get screenR(): number {
    return (this.width / (this.axisScale * 2)) * this.R;
  }

  private updateShapeScales(): void {
    this.shapeXScale = d3
      .scaleLinear()
      .domain([-this.R, this.R])
      .range([
        this.screenCenterX - this.screenR,
        this.screenCenterX + this.screenR,
      ]);

    this.shapeYScale = d3
      .scaleLinear()
      .domain([-this.R, this.R])
      .range([
        this.screenCenterY + this.screenR,
        this.screenCenterY - this.screenR,
      ]);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    this.initDimensions();
    this.initScales();
    this.redraw();
  }

  private redraw(): void {
    this.clear();
    this.drawAxes();
    this.drawShape();
    this.drawPoints();
  }

  private clear(): void {
    this.svg.selectAll('*').remove();
  }

  private drawAxes(): void {
    const axisXFragments = [
      d3
        .axisBottom(this.xScale)
        .ticks(10)
        .tickSize(-this.height / 2),
      d3
        .axisBottom(this.xScale)
        .tickFormat(() => '')
        .ticks(10)
        .tickSize(this.height / 2),
    ];
    const axisYFragments = [
      d3
        .axisLeft(this.yScale)
        .ticks(10)
        .tickSize(-this.width / 2),
      d3
        .axisLeft(this.yScale)
        .tickFormat(() => '')
        .ticks(10)
        .tickSize(this.width / 2),
    ];
    axisXFragments.forEach((axisXFragment) => {
      this.svg
        .append('g')
        .attr('transform', `translate(0, ${this.screenCenterY})`)
        .call(axisXFragment)
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#3a3a3a'))
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', 'var(--text-color)')
            .attr('transform', 'translate(20, 6) rotate(30)')
        );
    });
    axisYFragments.forEach((axisYFragment) => {
      this.svg
        .append('g')
        .attr('transform', `translate(${this.screenCenterX}, 0)`)
        .call(axisYFragment)
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#3a3a3a'))
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', 'var(--text-color)')
            .attr('transform', 'translate(-2, 6) rotate(-30)')
        );
    });
  }

  private drawShape(): void {
    this.svg
      .append('rect')
      .attr('x', this.shapeXScale(-this.R / 2))
      .attr('y', this.shapeYScale(0))
      .attr('width', this.shapeXScale(0) - this.shapeXScale(-this.R / 2))
      .attr('height', this.shapeYScale(0) - this.shapeYScale(this.R))
      .attr('fill', '#F05D23')
      .attr('opacity', '0.3');

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(this.screenR / 2)
      .startAngle(Math.PI * 1.5)
      .endAngle(Math.PI * 2);

    this.svg
      .append('path')
      .attr('d', (d) =>
        arc({
          startAngle: Math.PI * 1.5,
          endAngle: Math.PI * 2,
          innerRadius: 0,
          outerRadius: this.screenR / 2,
        })
      )
      .attr('fill', '#F05D23')
      .attr('opacity', '0.3')
      .attr(
        'transform',
        `translate(${this.shapeXScale(0)}, ${this.shapeYScale(0)})`
      );

    this.svg
      .append('polygon')
      .attr(
        'points',
        [
          [this.shapeXScale(0), this.shapeYScale(0)],
          [this.shapeXScale(this.R / 2), this.shapeYScale(0)],
          [this.shapeXScale(0), this.shapeYScale(-this.R / 2)],
        ]
          .map((point) => point.join(','))
          .join(' ')
      )
      .attr('fill', '#F05D23')
      .attr('opacity', '0.3');
  }

  private drawPoints(): void {
    this.svg
      .selectAll('.point')
      .data(this.points)
      .join('rect')
      .attr('class', 'point')
      .attr('x', (d) => {
        const xScreen = this.xScale(d.x) - this.pointSize / 2;
        return xScreen;
      })
      .attr('y', (d) => {
        const yScreen = this.yScale(d.y) - this.pointSize / 2;
        return yScreen;
      })
      .attr('width', this.pointSize)
      .attr('height', this.pointSize)
      .attr('fill', (d) => (d.isHit ? '#5dd17c' : '#e45a5a'));
  }

  public updateRadius(newRadius: number): void {
    this.R = newRadius;
    this.updateShapeScales();
    this.redraw();
  }

  public updatePoints(newPoints: ResultInfo[]): void {
    this.points = newPoints;
    this.drawPoints();
  }

  private setupClickHandler(): void {
    this.svg.on('click', (event: MouseEvent) => {
      const [x, y] = d3.pointer(event, this.svg.node());
      const xCoord = this.xScaleReversed(x);
      const yCoord = this.yScaleReversed(y);
      this.submitResult(xCoord, yCoord);
    });
  }

  public destroy(): void {
    this.resizeObserver.disconnect();
  }
}

@Component({
  selector: 'app-shooting-page',
  templateUrl: './shooting-page.component.html',
  styleUrl: './shooting-page.component.css',
  imports: [FormsModule, ReactiveFormsModule, NgIf],
})
export class ShootingPageComponent implements OnInit {
  // graph management
  @ViewChild('graphView') graphViewRef!: ElementRef;
  private graphRenderer!: GraphRenderer;
  private graphContainer!: HTMLElement;
  // data management
  protected shootingFormControl: FormGroup;
  private _snackBar = inject(MatSnackBar);
  protected results: ResultInfo[] = [];
  protected isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private resultsService: ResultsService,
    private el: ElementRef
  ) {
    this.shootingFormControl = this.fb.group({
      xShot: new FormControl('', [
        Validators.required,
        Validators.min(-4),
        Validators.max(4),
      ]),
      yShot: new FormControl('', [
        Validators.required,
        Validators.min(-5),
        Validators.max(5),
      ]),
      shapeRadius: new FormControl('', [
        Validators.required,
        Validators.min(1),
        Validators.max(4),
        Validators.pattern(
          `^(1(\.(25|5|75))?|2(\.(25|5|75))?|3(\.(25|5|75))?|4)$`
        ),
      ]),
    });
  }

  ngOnInit(): void {
    this.graphRenderer = new GraphRenderer('graph-view', 3, [], (x, y) => {
      if (this.getRadius() > 0) {
        this.shootingFormControl.patchValue({
          xShot: this.round2(x),
          yShot: this.round2(y),
        });
        if (this.shootingFormControl.valid) this.submitResult();
        else
          this._snackBar.open(
            'Forbidden coordinates, see form for more details',
            'OK'
          );
      } else {
        this._snackBar.open('First enter a valid shape radius', 'OK');
      }
    });
    this.fetchResults();
  }

  get xShot() {
    return this.shootingFormControl.get('xShot');
  }

  get yShot() {
    return this.shootingFormControl.get('yShot');
  }

  get shapeRadius() {
    return this.shootingFormControl.get('shapeRadius');
  }

  redrawGraph() {
    console.log('redraw graph called');
    this.graphRenderer.updateRadius(
      this.getRadius() == 0 ? 3 : this.getRadius()
    );
    this.graphRenderer.updatePoints(this.results);
  }

  getRadius(): number {
    const { shapeRadius } = this.shootingFormControl.value;
    return parseFloat(shapeRadius ? shapeRadius : 0);
  }

  round2(x: number): number {
    return Math.round(x * 10) / 10;
  }

  convertDateString(dateString: string): string | null {
    const parts = dateString.split(' ');
    if (parts.length < 6) {
      throw new Error('Invalid date format');
    }
    const timeSegment = parts[3];
    const timezone = parts[4];
    const timeParts = timeSegment.split(':');
    if (timeParts.length < 2) {
      throw new Error('Invalid time format');
    }
    const hours = timeParts[0].padStart(2, '0');
    const minutes = timeParts[1].padStart(2, '0');
    return `${hours}:${minutes}, ${timezone}`;
  }

  handleRequest<T>(
    action: () => Observable<T>,
    successMessage: string,
    onSuccess?: (data: T) => void,
    onError?: (error: any) => void
  ) {
    this.isLoading = true;

    action().subscribe({
      next: (data) => {
        this.isLoading = false;
        this._snackBar.open(successMessage, 'OK', { duration: 1400 });
        onSuccess?.(data);
      },
      error: (error) => {
        this.isLoading = false;
        onError
          ? onError(error)
          : this._snackBar.open(`Error: ${error.error}`, 'OK');
      },
    });
  }

  submitResult(): void {
    const { xShot, yShot, shapeRadius } = this.shootingFormControl.value;
    const xNum = this.round2(parseFloat(xShot));
    const yNum = this.round2(parseFloat(yShot));
    const radiusNum = this.round2(parseFloat(shapeRadius));
    if (isNaN(xNum) || isNaN(yNum) || isNaN(radiusNum)) return;

    this.handleRequest(
      () => this.resultsService.addResult(xNum, yNum, radiusNum),
      'New record added',
      (newResult: ResultInfo) => {
        this.results.push(newResult);
        this.redrawGraph();
      }
    );
  }

  fetchResults(): void {
    this.handleRequest(
      () => this.resultsService.getResults(),
      'Results fetched',
      (results: ResultInfo[]) => {
        this.results = results;
        this.redrawGraph();
      }
    );
  }

  clearResults(): void {
    this.handleRequest(
      () => this.resultsService.clearResults(),
      'Results cleared',
      () => {
        this.results = [];
        this.redrawGraph();
      }
    );
  }
}

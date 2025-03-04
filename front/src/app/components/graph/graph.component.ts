import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import * as d3 from 'd3';

interface Point {
  shotX: number;
  shotY: number;
  result: boolean;
  id: number;
}

class GraphRenderer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private pointSize = 5;
  private axisScale = 5;
  private _R: number = 1;
  private _points: Point[] = [];
  private resizeObserver!: ResizeObserver;
  private width!: number;
  private height!: number;
  private screenCenterX!: number;
  private screenCenterY!: number;
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;
  private xScaleReversed!: d3.ScaleLinear<number, number, never>;
  private yScaleReversed!: d3.ScaleLinear<number, number, never>;
  private shapeXScale!: d3.ScaleLinear<number, number, never>;
  private shapeYScale!: d3.ScaleLinear<number, number, never>;

  constructor(container: HTMLElement) {
    this.container = container;
    this.svg = d3.select(container).append<SVGSVGElement>('svg');
    this.initDimensions();
    this.initScales();
    this.setupResizeObserver();
    this.redraw();
  }

  get R(): number {
    return this._R;
  }

  set R(newRadius: number) {
    this._R = newRadius;
    this.updateShapeScales();
    this.redraw();
  }

  get points(): Point[] {
    return this._points;
  }

  set points(newPoints: Point[]) {
    this._points = newPoints;
    this.drawPoints();
  }

  initDimensions() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.screenCenterX = this.width / 2;
    this.screenCenterY = this.height / 2;
    this.svg.attr('width', this.width).attr('height', this.height);
  }

  initScales() {
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

  get screenR() {
    return (this.width / (this.axisScale * 2)) * this.R;
  }

  updateShapeScales() {
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

  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);
  }

  handleResize() {
    this.initDimensions();
    this.initScales();
    this.redraw();
  }

  redraw() {
    this.clear();
    this.drawAxes();
    this.drawShape();
    this.drawPoints();
  }

  clear() {
    this.svg.selectAll('*').remove();
  }

  drawAxes() {
    const axisXFragments = [
      d3
        .axisBottom(this.xScale)
        .ticks(10)
        .tickSize(-this.height / 2),
      d3
        .axisBottom(this.xScale)
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
        .ticks(10)
        .tickSize(this.width / 2),
    ];
    axisXFragments.forEach((axisXFragment) => {
      this.svg
        .append('g')
        .attr('transform', `translate(0, ${this.screenCenterY})`)
        .call(axisXFragment)
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g.selectAll('.tick line').attr('stroke', 'var(--border-color)')
        )
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
        .call((g) =>
          g.selectAll('.tick line').attr('stroke', 'var(--border-color)')
        )
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', 'var(--text-color)')
            .attr('transform', 'translate(-2, 6) rotate(-30)')
        );
    });
  }

  drawShape() {
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
      .attr('d', !arc)
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
        ].join(' ')
      )
      .attr('fill', '#F05D23')
      .attr('opacity', '0.3');
  }

  drawPoints() {
    this.svg
      .selectAll('.point')
      .data(this.points, (d: any) => d.id)
      .join('rect')
      .attr('class', 'point')
      .attr('x', (d) => {
        const xScreen = this.xScale(d.shotX) - this.pointSize / 2;
        return xScreen;
      })
      .attr('y', (d) => {
        const yScreen = this.yScale(d.shotY) - this.pointSize / 2;
        return yScreen;
      })
      .attr('width', this.pointSize)
      .attr('height', this.pointSize)
      .attr('fill', (d) => (d.result ? '#5dd17c' : '#e45a5a'));
  }

  updateRadius(newRadius: number) {
    this.R = newRadius;
  }

  updatePoints(newPoints: Point[]) {
    this.points = newPoints;
  }

  destroy() {
    this.resizeObserver.disconnect();
  }

  getGraphCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect();
    const xOffset = event.clientX - rect.left;
    const yOffset = event.clientY - rect.top;
    return {
      x: this.xScaleReversed(xOffset),
      y: this.yScaleReversed(yOffset),
    };
  }
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
})
export class GraphComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild('graphView') graphViewRef!: ElementRef;
  @Input() radius: number = 1;
  @Input() points: Point[] = [];
  private graphRenderer!: GraphRenderer;
  private graphContainer!: HTMLElement;
  constructor(private el: ElementRef) {}
  ngOnInit(): void {
    this.graphContainer = this.el.nativeElement.querySelector('.container');
    if (this.graphContainer) {
      this.graphRenderer = new GraphRenderer(this.graphContainer);
      this.graphRenderer.R = this.radius;
      this.graphRenderer.points = this.points;
    } else {
      console.error('Graph container element not found');
    }
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.graphRenderer) {
      if (changes['radius']) {
        this.graphRenderer.R = changes['radius'].currentValue;
      }
      if (changes['points']) {
        this.graphRenderer.points = changes['points'].currentValue;
        this.graphRenderer.redraw();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.graphRenderer) {
      this.graphRenderer.destroy();
    }
  }

  onGraphClick(event: MouseEvent): void {
    if (this.graphRenderer) {
      const coordinates = this.graphRenderer.getGraphCoordinates(event);
      console.log('Graph clicked at:', coordinates.x, coordinates.y);
    }
  }
}
